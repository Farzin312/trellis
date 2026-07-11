import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const scripts = join(root, '.trellis', 'scripts');

function fixture(config = {
  schema_version: 1,
  project_name: 'Fixture',
  project_slug: 'fixture',
  stacks: ['javascript'],
  enabled_integrations: [],
  project_setting: 'preserve',
}) {
  const project = mkdtempSync(join(tmpdir(), 'trellis-config-'));
  mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
  for (const file of ['config.mjs', 'config-core.mjs']) {
    copyFileSync(join(scripts, file), join(project, '.trellis', 'scripts', file));
  }
  if (config !== null) writeFileSync(join(project, '.trellis', 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
  return project;
}

function run(project, ...args) {
  return spawnSync(process.execPath, [join(project, '.trellis', 'scripts', 'config.mjs'), ...args], {
    cwd: project,
    encoding: 'utf8',
  });
}

test('show validates and prints canonical configuration without writing', () => {
  const project = fixture();
  try {
    const path = join(project, '.trellis', 'config.json');
    const before = readFileSync(path, 'utf8');
    const result = run(project, 'show');
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), JSON.parse(before));
    assert.equal(readFileSync(path, 'utf8'), before);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('enable and disable are atomic, idempotent, and preserve unrelated fields', () => {
  const project = fixture();
  try {
    for (const args of [
      ['enable', 'graphify'],
      ['enable', 'graphify'],
      ['enable', 'bounds'],
      ['disable', 'graphify'],
      ['disable', 'graphify'],
    ]) {
      const result = run(project, ...args);
      assert.equal(result.status, 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    }
    const config = JSON.parse(readFileSync(join(project, '.trellis', 'config.json'), 'utf8'));
    assert.deepEqual(config.enabled_integrations, ['bounds']);
    assert.equal(config.project_setting, 'preserve');
    assert.deepEqual(
      readdirSync(join(project, '.trellis')).filter((name) => name.includes('.tmp-')),
      [],
    );
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('invalid config and unsupported mutations fail before changing bytes', () => {
  for (const config of [
    { schema_version: 2, project_name: 'X', project_slug: 'x', stacks: ['generic'], enabled_integrations: [] },
    { schema_version: 1, project_name: 'X', project_slug: 'x', stacks: ['python', 'python'], enabled_integrations: [] },
    { schema_version: 1, project_name: 'X', project_slug: 'x', stacks: ['generic'], enabled_integrations: ['unknown'] },
  ]) {
    const project = fixture(config);
    try {
      const path = join(project, '.trellis', 'config.json');
      const before = readFileSync(path, 'utf8');
      const result = run(project, 'enable', 'graphify');
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /FAIL: invalid configuration/);
      assert.equal(readFileSync(path, 'utf8'), before);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }
});

test('unknown commands and integrations are usage errors; missing config is operational failure', () => {
  const project = fixture();
  const missing = fixture(null);
  try {
    for (const args of [[], ['set'], ['enable'], ['enable', 'phoenix'], ['show', 'extra']]) {
      const result = run(project, ...args);
      assert.equal(result.status, 2, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, /Usage:/);
    }
    const result = run(missing, 'show');
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /run trellis init/i);
    assert.equal(existsSync(join(missing, '.trellis', 'config.json')), false);
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(missing, { recursive: true, force: true });
  }
});
