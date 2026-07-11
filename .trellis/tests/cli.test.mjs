import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const cli = join(root, '.trellis', 'cli.mjs');

function run(args, cwd = root) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

test('CLI exposes one canonical version', () => {
  const result = run(['--version']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '0.1.0');
});

test('CLI rejects unsafe names, traversal, unknown flags, and missing operands', () => {
  for (const args of [
    ['new'],
    ['new', '../escape'],
    ['new', 'bad;touch-proof'],
    ['new', 'valid-name', '--unknown'],
    ['metrics', '--unknown'],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
});

test('project commands execute in the caller repository', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-cwd-'));
  try {
    const scripts = join(cwd, '.trellis', 'scripts');
    mkdirSync(scripts, { recursive: true });
    writeFileSync(join(scripts, 'metrics.mjs'), "console.log('CALLER_ROOT')\n");
    const result = run(['metrics'], cwd);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CALLER_ROOT/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
