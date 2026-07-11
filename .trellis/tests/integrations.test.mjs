import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'check-integrations.mjs');

function fixture(enabled = []) {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-integrations-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'check-integrations.mjs'));
  copyFileSync(
    join(root, '.trellis', 'scripts', 'config-core.mjs'),
    join(cwd, '.trellis', 'scripts', 'config-core.mjs'),
  );
  writeFileSync(join(cwd, '.trellis', 'config.json'), JSON.stringify({
    schema_version: 1,
    project_name: 'Fixture',
    project_slug: 'fixture',
    stacks: ['generic'],
    enabled_integrations: enabled,
  }));
  return cwd;
}

function run(cwd, env = {}) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'check-integrations.mjs')], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function fakeCommand(cwd, name, body) {
  const bin = join(cwd, 'bin');
  mkdirSync(bin, { recursive: true });
  const path = join(bin, name);
  writeFileSync(path, `#!${process.execPath}\n${body}\n`);
  chmodSync(path, 0o755);
  return bin;
}

test('unconfigured integrations skip explicitly', () => {
  const cwd = fixture();
  try {
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /SKIP integration=graphify reason=not-configured/);
    assert.match(result.stdout, /SKIP integration=bounds reason=not-configured/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('configured but missing integrations fail actionably', () => {
  const cwd = fixture(['graphify']);
  try {
    const result = run(cwd, { PATH: '' });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /FAIL integration=graphify reason=missing-command/);
    assert.match(result.stderr, /install/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('configured Graphify rejects a corrupt graph', () => {
  const cwd = fixture(['graphify']);
  try {
    const bin = fakeCommand(cwd, 'graphify', "console.log('graphify 1.0');");
    mkdirSync(join(cwd, 'graphify-out'));
    writeFileSync(join(cwd, 'graphify-out', 'graph.json'), '{broken');
    const result = run(cwd, { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /FAIL integration=graphify reason=corrupt-artifact/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('configured Bounds rejects zero effective coverage', () => {
  const cwd = fixture(['bounds']);
  try {
    const bin = fakeCommand(cwd, 'bounds', `
if (process.argv[2] === 'coverage') {
  console.log(JSON.stringify({ supported: { total: 4, mapped: 0 }, mapped_pct: 0 }));
}
`);
    mkdirSync(join(cwd, '.bounds'));
    writeFileSync(join(cwd, '.bounds', 'root.yaml'), 'version: 1\n');
    const result = run(cwd, { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /FAIL integration=bounds reason=zero-coverage/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
