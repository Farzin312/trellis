#!/usr/bin/env node
/**
 * metrics.mjs — thin ledger reader + cost summarizer.
 *
 * Reads .trellis/metrics/runs.jsonl and .trellis/scripts/model-pricing.json,
 * prints a summary: total tokens, total cost, grouped by agent and phase.
 *
 * Also provides appendRun() for other scripts to write records.
 *
 * Usage:
 *   node .trellis/scripts/metrics.mjs              # summary
 *   node .trellis/scripts/metrics.mjs --recent      # last 10 sessions
 *   node .trellis/scripts/metrics.mjs --raw         # dump runs.jsonl
 *   node .trellis/scripts/metrics.mjs --append '{"ts":"...","agent":"..."}'
 */

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const metricsDir = join(root, '.trellis', 'metrics');
const runsFile = join(metricsDir, 'runs.jsonl');
const pricingFile = join(__dirname, 'model-pricing.json');

// --- Pricing ---
function loadPricing() {
  if (!existsSync(pricingFile)) return { _fallback: { input_per_mtok: 0, output_per_mtok: 0 }, _updated: 'unknown' };
  return JSON.parse(readFileSync(pricingFile, 'utf8'));
}

function computeCost(tokensIn, tokensOut, model, pricing) {
  const rates = pricing[model] || pricing._fallback || { input_per_mtok: 0, output_per_mtok: 0 };
  return (tokensIn / 1e6) * rates.input_per_mtok + (tokensOut / 1e6) * rates.output_per_mtok;
}

// --- Ledger read ---
function readRuns() {
  if (!existsSync(runsFile)) return [];
  return readFileSync(runsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

// --- Append (for other scripts) ---
function appendRun(record) {
  mkdirSync(metricsDir, { recursive: true });
  const pricing = loadPricing();
  if (record.est_cost_usd === undefined && record.tokens_in !== undefined) {
    record.est_cost_usd = computeCost(record.tokens_in || 0, record.tokens_out || 0, record.model || '', pricing);
  }
  if (record.pricing_version === undefined) {
    record.pricing_version = pricing._updated || 'unknown';
  }
  appendFileSync(runsFile, JSON.stringify(record) + '\n');
}

// --- Summary ---
function summarize(runs) {
  const pricing = loadPricing();
  const pricingVersion = pricing._updated || 'unknown';

  const totals = { tokens_in: 0, tokens_out: 0, cost: 0, tool_calls: 0, runs: runs.length };
  const byAgent = {};
  const byPhase = {};

  for (const r of runs) {
    totals.tokens_in += r.tokens_in || 0;
    totals.tokens_out += r.tokens_out || 0;
    totals.cost += r.est_cost_usd || 0;
    totals.tool_calls += r.tool_calls || 0;

    const agent = r.agent || 'unknown';
    if (!byAgent[agent]) byAgent[agent] = { tokens_in: 0, tokens_out: 0, cost: 0, runs: 0 };
    byAgent[agent].tokens_in += r.tokens_in || 0;
    byAgent[agent].tokens_out += r.tokens_out || 0;
    byAgent[agent].cost += r.est_cost_usd || 0;
    byAgent[agent].runs += 1;

    const phase = r.phase || r.phase_or_task || 'unspecified';
    if (!byPhase[phase]) byPhase[phase] = { cost: 0, runs: 0 };
    byPhase[phase].cost += r.est_cost_usd || 0;
    byPhase[phase].runs += 1;
  }

  return { totals, byAgent, byPhase, pricingVersion };
}

// --- CLI ---
const arg = process.argv[2] || '';

// --append mode: write a record from CLI
if (arg === '--append') {
  const json = process.argv[3];
  if (!json) {
    console.error('Usage: metrics.mjs --append \'{"ts":"...","agent":"..."}\'');
    process.exit(1);
  }
  try {
    const record = JSON.parse(json);
    if (!record.ts) record.ts = new Date().toISOString();
    appendRun(record);
    console.log('OK: record appended');
  } catch (e) {
    console.error('FAIL: invalid JSON:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

const runs = readRuns();

if (runs.length === 0) {
  console.log('No metrics recorded yet.');
  console.log('');
  console.log('The ledger is at .trellis/metrics/runs.jsonl (git-ignored).');
  console.log('Records are appended by:');
  console.log('  - Eval runner (run-evals.mjs)');
  console.log('  - Claude Code Stop/SubagentStop hooks');
  console.log('  - Manual: trellis metrics --append \'{"ts":"...","agent":"..."}\'');
  console.log('');
  console.log('See docs/metrics.md for the full schema.');
  process.exit(0);
}

if (arg === '--raw') {
  for (const r of runs) console.log(JSON.stringify(r));
  process.exit(0);
}

if (arg === '--recent') {
  const recent = runs.slice(-10);
  console.log(`Last ${recent.length} session(s):\n`);
  for (const r of recent) {
    const cost = r.est_cost_usd ? `$${r.est_cost_usd.toFixed(4)}` : 'n/a';
    console.log(`  ${r.ts}  ${r.agent || '?'}  ${r.model || '?'}  ${r.phase || '?'}  ${cost}`);
  }
  process.exit(0);
}

// Default: summary
const s = summarize(runs);
console.log('═══════════════════════════════════════════');
console.log('  TRELLIS METRICS SUMMARY');
console.log('═══════════════════════════════════════════');
console.log(`  Sessions:     ${s.totals.runs}`);
console.log(`  Tokens in:    ${s.totals.tokens_in.toLocaleString()}`);
console.log(`  Tokens out:   ${s.totals.tokens_out.toLocaleString()}`);
console.log(`  Est. cost:    $${s.totals.cost.toFixed(4)}`);
console.log(`  Tool calls:   ${s.totals.tool_calls}`);
console.log(`  Pricing ver:  ${s.pricingVersion}`);
console.log('');

console.log('  By agent:');
for (const [agent, data] of Object.entries(s.byAgent).sort((a, b) => b[1].cost - a[1].cost)) {
  console.log(`    ${agent.padEnd(12)} ${data.runs} runs  $${data.cost.toFixed(4)}  ${(data.tokens_in + data.tokens_out).toLocaleString()} tokens`);
}
console.log('');

console.log('  By phase:');
for (const [phase, data] of Object.entries(s.byPhase).sort((a, b) => b[1].cost - a[1].cost)) {
  console.log(`    ${phase.padEnd(14)} ${data.runs} runs  $${data.cost.toFixed(4)}`);
}
console.log('═══════════════════════════════════════════');
