#!/usr/bin/env node

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const metricsDir = join(root, '.trellis', 'metrics');
const runsFile = join(metricsDir, 'runs.jsonl');
const stringFields = ['ts', 'agent', 'model', 'phase', 'phase_or_task', 'result', 'pricing_version'];
const numberFields = ['tokens_in', 'tokens_out', 'est_cost_usd', 'tool_calls', 'duration_ms'];
const integerFields = new Set(['tokens_in', 'tokens_out', 'tool_calls', 'duration_ms']);
const knownFields = new Set([...stringFields, ...numberFields]);
const MAX_LEDGER_BYTES = 50 * 1024 * 1024;
const MAX_RECORD_BYTES = 64 * 1024;

function usage() {
  console.error('Usage: metrics.mjs [--recent | --raw | --append <json>]');
  process.exit(2);
}

function validationError(record) {
  if (!record || Array.isArray(record) || typeof record !== 'object') return 'record must be a JSON object';
  const unknown = Object.keys(record).find((field) => !knownFields.has(field));
  if (unknown) return `unknown field ${unknown}`;
  for (const field of stringFields) {
    if (record[field] !== undefined && typeof record[field] !== 'string') return `${field} must be a string`;
  }
  for (const field of numberFields) {
    if (record[field] === undefined) continue;
    if (typeof record[field] !== 'number' || !Number.isFinite(record[field])) return `${field} must be finite`;
    if (record[field] < 0) return `${field} must be non-negative`;
    if (record[field] > Number.MAX_SAFE_INTEGER) return `${field} exceeds the safe numeric range`;
    if (integerFields.has(field) && !Number.isSafeInteger(record[field])) return `${field} must be a safe integer`;
  }
  return null;
}

function readRuns() {
  if (!existsSync(runsFile)) return [];
  if (statSync(runsFile).size > MAX_LEDGER_BYTES) {
    console.error(`FAIL: runs.jsonl exceeds ${MAX_LEDGER_BYTES} bytes; archive old records before summarizing`);
    process.exit(1);
  }
  const runs = [];
  const errors = [];
  for (const [index, line] of readFileSync(runsFile, 'utf8').split('\n').entries()) {
    if (!line.trim()) continue;
    if (Buffer.byteLength(line) > MAX_RECORD_BYTES) {
      errors.push(`FAIL: runs.jsonl:${index + 1} record exceeds ${MAX_RECORD_BYTES} bytes`);
      continue;
    }
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      errors.push(`FAIL: runs.jsonl:${index + 1} invalid JSON: ${error.message}`);
      continue;
    }
    const error = validationError(record);
    if (error) errors.push(`FAIL: runs.jsonl:${index + 1} ${error}`);
    else runs.push(record);
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  return runs;
}

function appendRun(input) {
  const inputError = validationError(input);
  if (inputError) {
    console.error(`FAIL: record ${inputError}`);
    process.exit(1);
  }
  const record = { ...input, ts: input.ts || new Date().toISOString() };
  const error = validationError(record);
  if (error) {
    console.error(`FAIL: record ${error}`);
    process.exit(1);
  }
  const serialized = JSON.stringify(record);
  if (Buffer.byteLength(serialized) > MAX_RECORD_BYTES) {
    console.error(`FAIL: record exceeds ${MAX_RECORD_BYTES} bytes`);
    process.exit(1);
  }
  mkdirSync(metricsDir, { recursive: true });
  appendFileSync(runsFile, `${serialized}\n`, { encoding: 'utf8', flag: 'a' });
}

const args = process.argv.slice(2);
if (args.length > 0 && !['--recent', '--raw', '--append'].includes(args[0])) usage();
if ((args[0] === '--recent' || args[0] === '--raw') && args.length !== 1) usage();
if (args[0] === '--append' && args.length !== 2) usage();

if (args[0] === '--append') {
  let record;
  try {
    record = JSON.parse(args[1]);
  } catch (error) {
    console.error(`FAIL: invalid JSON: ${error.message}`);
    process.exit(1);
  }
  appendRun(record);
  console.log('PASS: metrics record appended');
  process.exit(0);
}

const runs = readRuns();
if (runs.length === 0) {
  console.log('SKIP: no metrics records');
  process.exit(0);
}

if (args[0] === '--raw') {
  for (const run of runs) console.log(JSON.stringify(run));
  process.exit(0);
}

if (args[0] === '--recent') {
  const recent = runs.slice(-10);
  console.log(`Last ${recent.length} record(s):`);
  for (const run of recent) {
    const cost = run.est_cost_usd === undefined ? 'n/a' : `$${run.est_cost_usd.toFixed(4)}`;
    console.log(`${run.ts || '?'} ${run.agent || '?'} ${run.model || '?'} ${run.phase || run.phase_or_task || '?'} ${cost}`);
  }
  process.exit(0);
}

const totals = runs.reduce((sum, run) => ({
  tokensIn: sum.tokensIn + (run.tokens_in ?? 0),
  tokensOut: sum.tokensOut + (run.tokens_out ?? 0),
  cost: sum.cost + (run.est_cost_usd ?? 0),
  toolCalls: sum.toolCalls + (run.tool_calls ?? 0),
}), { tokensIn: 0, tokensOut: 0, cost: 0, toolCalls: 0 });
if (!Number.isSafeInteger(totals.tokensIn) || !Number.isSafeInteger(totals.tokensOut)
  || !Number.isSafeInteger(totals.toolCalls) || !Number.isFinite(totals.cost)
  || totals.cost > Number.MAX_SAFE_INTEGER) {
  console.error('FAIL: metrics totals exceed the safe numeric range; split or archive the ledger');
  process.exit(1);
}

const byAgent = new Map();
for (const run of runs) {
  const agent = run.agent || 'unknown';
  const value = byAgent.get(agent) || { runs: 0, tokens: 0, cost: 0 };
  value.runs++;
  value.tokens += (run.tokens_in ?? 0) + (run.tokens_out ?? 0);
  value.cost += run.est_cost_usd ?? 0;
  byAgent.set(agent, value);
}

console.log('TRELLIS METRICS SUMMARY');
console.log(`Records:       ${runs.length}`);
console.log(`Tokens in:     ${totals.tokensIn}`);
console.log(`Tokens out:    ${totals.tokensOut}`);
console.log(`Reported cost: $${totals.cost.toFixed(4)}`);
console.log(`Tool calls:    ${totals.toolCalls}`);
console.log('By agent:');
for (const [agent, value] of [...byAgent].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${agent} records=${value.runs} tokens=${value.tokens} reported_cost=$${value.cost.toFixed(4)}`);
}
