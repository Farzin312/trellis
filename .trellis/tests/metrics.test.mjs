import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'metrics.mjs');

function fixture(lines) {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-metrics-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(cwd, '.trellis', 'metrics'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'metrics.mjs'));
  writeFileSync(join(cwd, '.trellis', 'metrics', 'runs.jsonl'), `${lines.join('\n')}\n`);
  return cwd;
}

function run(cwd, args = []) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'metrics.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('corrupt JSONL fails with the exact line number', () => {
  const cwd = fixture(['{"agent":"codex","tokens_in":1}', '{broken']);
  try {
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /runs\.jsonl:2/);
    assert.match(result.stderr, /invalid JSON/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('invalid numeric usage fails instead of corrupting totals', () => {
  const cwd = fixture([
    '{"agent":"codex","tokens_in":1}',
    '{"agent":"claude","tokens_out":-2}',
  ]);
  try {
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /runs\.jsonl:2/);
    assert.match(result.stderr, /tokens_out.*non-negative/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('unknown fields and unsafe integers fail the stable ledger schema', () => {
  for (const line of [
    '{"agent":"codex","invented":true}',
    `{"tokens_in":${Number.MAX_SAFE_INTEGER + 1}}`,
    JSON.stringify({ agent: 'codex\u001b[2J' }),
  ]) {
    const cwd = fixture([line]);
    try {
      const result = run(cwd);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /runs\.jsonl:1/);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test('summary uses only supplied usage and cost values', () => {
  const cwd = fixture([
    '{"agent":"codex","phase":"plan","tokens_in":10,"tokens_out":4}',
    '{"agent":"claude","phase":"implement","tokens_in":6,"est_cost_usd":0.25,"tool_calls":2}',
  ]);
  try {
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Tokens in:\s+16/);
    assert.match(result.stdout, /Tokens out:\s+4/);
    assert.match(result.stdout, /Reported cost:\s+\$0\.2500/);
    assert.doesNotMatch(result.stdout, /Pricing|estimated|fallback/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('unknown options are usage errors', () => {
  const cwd = fixture([]);
  try {
    const result = run(cwd, ['--unknown']);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /Usage:/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('symlinked ledgers are rejected instead of reading outside the project', () => {
  const cwd = fixture([]);
  const outside = mkdtempSync(join(tmpdir(), 'trellis-metrics-outside-'));
  try {
    const ledger = join(cwd, '.trellis', 'metrics', 'runs.jsonl');
    rmSync(ledger);
    writeFileSync(join(outside, 'runs.jsonl'), '{"agent":"outside-secret","tokens_in":1}\n');
    symlinkSync(join(outside, 'runs.jsonl'), ledger);
    const result = run(cwd, ['--raw']);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /runs\.jsonl.*non-symlink/i);
    assert.doesNotMatch(result.stdout, /outside-secret/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('combined per-agent token totals cannot exceed the safe numeric range', () => {
  const cwd = fixture([JSON.stringify({
    agent: 'codex',
    tokens_in: Number.MAX_SAFE_INTEGER,
    tokens_out: Number.MAX_SAFE_INTEGER,
  })]);
  try {
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /totals for agent.*safe numeric range/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
