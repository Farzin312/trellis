import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const cli = join(root, '.trellis', 'cli.mjs');

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: '1', NO_COLOR: '1' },
  });
}

test('clean scaffold installs and passes its own portable aggregate gate', { timeout: 30_000 }, () => {
  const parent = mkdtempSync(join(tmpdir(), 'trellis-scaffold-smoke-'));
  const project = join(parent, 'sample-project');
  try {
    const created = run(process.execPath, [cli, 'new', 'sample-project', '--stack=typescript'], parent);
    assert.equal(created.status, 0, created.stdout + created.stderr);

    const pkg = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(project, 'package-lock.json'), 'utf8'));
    const config = JSON.parse(readFileSync(join(project, '.trellis', 'config.json'), 'utf8'));
    assert.equal(pkg.name, 'sample-project');
    assert.equal(pkg.private, true);
    assert.equal(pkg.license, undefined);
    assert.equal(pkg.repository, undefined);
    assert.equal(pkg.type, undefined);
    assert.equal(lock.name, 'sample-project');
    assert.deepEqual(config, {
      schema_version: 1,
      project_name: 'sample-project',
      project_slug: 'sample-project',
      stacks: ['typescript'],
      enabled_integrations: [],
    });

    assert.equal(existsSync(join(project, 'LICENSE')), false);
    assert.equal(existsSync(join(project, '.gitattributes')), true);
    assert.equal(existsSync(join(project, '.trellis', 'LICENSE')), true);
    assert.equal(existsSync(join(project, '.codex')), false);
    assert.equal(existsSync(join(project, '.opencode')), false);
    assert.equal(existsSync(join(project, '.claude', 'commands')), false);
    assert.equal(existsSync(join(project, '.claude', 'skills', 'sdd', 'SKILL.md')), true);
    assert.equal(existsSync(join(project, 'docs', 'DESIGN.md')), false);
    assert.match(readFileSync(join(project, 'README.md'), 'utf8'), /^# sample-project/m);
    assert.match(readFileSync(join(project, 'docs', 'README.md'), 'utf8'), /# Project documentation/);

    const shippedTests = readdirSync(join(project, '.trellis', 'tests')).sort();
    assert.ok(shippedTests.includes('cli.test.mjs'));
    assert.ok(!shippedTests.includes('package.test.mjs'));
    assert.ok(!shippedTests.includes('scaffold-smoke.test.mjs'));

    const installed = run('npm', ['ci', '--ignore-scripts'], project);
    assert.equal(installed.status, 0, installed.stdout + installed.stderr);
    const checked = run('npm', ['run', 'check'], project);
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
