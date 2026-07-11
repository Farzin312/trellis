import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const cli = join(root, '.trellis', 'cli.mjs');

function run(args, cwd = root, env = process.env) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', env });
}

test('CLI exposes one canonical version', () => {
  const result = run(['--version']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '0.1.0');
});

test('help supports the conventional --help alias', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /trellis setup/);
});

test('guided setup questions work before a target contains Trellis', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-setup-cli-'));
  try {
    const result = run(['setup', 'questions', '--json'], cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const output = JSON.parse(result.stdout);
    assert.ok(output.required_fields.includes('project_scope'));

    for (const args of [
      ['setup'],
      ['setup', 'questions', '--answers=x'],
      ['setup', 'plan'],
      ['setup', 'unknown'],
    ]) {
      const invalid = run(args, cwd);
      assert.equal(invalid.status, 2, `${args.join(' ')}\n${invalid.stdout}\n${invalid.stderr}`);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Graphify wrapper requires project configuration and uses the current update contract', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-graph-'));
  try {
    mkdirSync(join(cwd, '.trellis'), { recursive: true });
    const config = {
      schema_version: 1,
      project_name: 'Fixture',
      project_slug: 'fixture',
      stacks: ['generic'],
      enabled_integrations: [],
    };
    writeFileSync(join(cwd, '.trellis', 'config.json'), JSON.stringify(config));

    const unconfigured = run(['graph'], cwd);
    assert.equal(unconfigured.status, 1, unconfigured.stdout + unconfigured.stderr);
    assert.match(unconfigured.stderr, /not enabled/i);

    config.enabled_integrations = ['graphify'];
    writeFileSync(join(cwd, '.trellis', 'config.json'), JSON.stringify(config));
    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const graphify = join(bin, 'graphify');
    writeFileSync(graphify, `#!${process.execPath}\nconsole.log(process.argv.slice(2).join('|'));\n`);
    chmodSync(graphify, 0o755);

    const configured = run(['graph'], cwd, { ...process.env, PATH: `${bin}:${process.env.PATH}` });
    assert.equal(configured.status, 0, configured.stdout + configured.stderr);
    assert.match(configured.stdout, /^update\|\.$/m);

    const retiredFlag = run(['graph', '--update'], cwd, { ...process.env, PATH: `${bin}:${process.env.PATH}` });
    assert.equal(retiredFlag.status, 2, retiredFlag.stdout + retiredFlag.stderr);

    const scopedPath = run(['graph', 'src'], cwd, { ...process.env, PATH: `${bin}:${process.env.PATH}` });
    assert.equal(scopedPath.status, 2, scopedPath.stdout + scopedPath.stderr);
    assert.match(scopedPath.stderr, /accepts no operands/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('init accepts a display name with spaces and preserves it as one argument', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-init-name-'));
  try {
    mkdirSync(join(cwd, '.trellis'), { recursive: true });
    writeFileSync(
      join(cwd, '.trellis', 'init.sh'),
      '#!/usr/bin/env bash\nprintf "%s\\n" "$@"\n',
    );
    const result = run(['init', 'My Project'], cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout.trim(), 'My Project');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('CLI rejects unsafe names, traversal, unknown flags, and missing operands', () => {
  for (const args of [
    ['new'],
    ['new', '../escape'],
    ['new', 'bad;touch-proof'],
    ['new', 'a'.repeat(201)],
    ['init', `unsafe\u009bname`],
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
