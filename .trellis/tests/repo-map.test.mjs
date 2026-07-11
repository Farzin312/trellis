import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'repo-map.mjs');

function fixture() {
  const project = mkdtempSync(join(tmpdir(), 'trellis map '));
  mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
  copyFileSync(source, join(project, '.trellis', 'scripts', 'repo-map.mjs'));
  mkdirSync(join(project, 'src'), { recursive: true });
  mkdirSync(join(project, 'path with spaces'), { recursive: true });
  mkdirSync(join(project, 'docs', 'systems', 'billing'), { recursive: true });
  mkdirSync(join(project, 'node_modules', 'leak'), { recursive: true });
  mkdirSync(join(project, 'dist'), { recursive: true });
  mkdirSync(join(project, '.specify', 'specs', 'secret-history'), { recursive: true });
  writeFileSync(join(project, 'package.json'), '{"name":"fixture","scripts":{"test:project":"node --test"}}\n');
  writeFileSync(join(project, '.trellis', 'config.json'), JSON.stringify({
    schema_version: 1,
    project_name: 'Fixture',
    project_slug: 'fixture',
    stacks: ['javascript'],
    enabled_integrations: [],
  }));
  writeFileSync(join(project, 'src', 'z.js'), 'export const z = 1;\n');
  writeFileSync(join(project, 'src', 'a.test.js'), 'export const test = true;\n');
  writeFileSync(join(project, 'path with spaces', 'worker.py'), 'value = 1\n');
  writeFileSync(join(project, '.env'), 'SECRET=do-not-map\n');
  writeFileSync(join(project, 'node_modules', 'leak', 'secret.js'), 'secret\n');
  writeFileSync(join(project, 'dist', 'generated.js'), 'generated\n');
  writeFileSync(join(project, '.specify', 'specs', 'secret-history', 'spec.md'), 'history\n');
  writeFileSync(
    join(project, 'docs', 'systems', 'billing', 'README.md'),
    '# Billing system\n\n> Parent: [systems](../README.md)\n\n## Public Surface\n\n- `charge()`\n',
  );
  const outside = mkdtempSync(join(tmpdir(), 'trellis-map-outside-'));
  writeFileSync(join(outside, 'outside.pem'), 'private\n');
  symlinkSync(outside, join(project, 'linked-outside'));
  return { project, outside };
}

function run(project, args = []) {
  return spawnSync(process.execPath, [join(project, '.trellis', 'scripts', 'repo-map.mjs'), ...args], {
    cwd: project,
    encoding: 'utf8',
  });
}

test('JSON map is stable, bounded, read-only, and excludes non-source trees', () => {
  const { project, outside } = fixture();
  try {
    const beforeEnv = existsSync(join(project, '.env'));
    const first = run(project, ['--json']);
    const second = run(project, ['--json']);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.equal(first.stdout, second.stdout);
    assert.equal(beforeEnv, true);
    assert.equal(existsSync(join(project, '.env')), true);

    const map = JSON.parse(first.stdout);
    assert.equal(map.schema_version, 1);
    assert.deepEqual(map.stacks, ['javascript']);
    assert.deepEqual(map.manifests, ['package.json']);
    assert.equal(map.summary.tests, 1);
    assert.equal(map.truncated, false);
    assert.deepEqual(map.systems, [{
      name: 'billing',
      path: 'docs/systems/billing/README.md',
      title: 'Billing system',
      public_surface: ['`charge()`'],
    }]);
    assert.deepEqual(map.integrations, { bounds: false, graphify: false });
    const serialized = JSON.stringify(map);
    for (const excluded of ['SECRET', 'node_modules', 'generated.js', 'secret-history', 'outside.pem']) {
      assert.doesNotMatch(serialized, new RegExp(excluded));
    }
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('human map explains core orientation and optional deeper tools', () => {
  const { project, outside } = fixture();
  try {
    const result = run(project);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /TRELLIS REPOSITORY MAP/);
    assert.match(result.stdout, /documented systems:\s+1/);
    assert.match(result.stdout, /billing.*Billing system/);
    assert.match(result.stdout, /Graphify: not configured.*deeper symbol\/dependency graph/i);
    assert.match(result.stdout, /Bounds: not configured.*boundary enforcement/i);
    assert.ok(result.stdout.length < 4000, `map output is too large: ${result.stdout.length}`);
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('unknown map options are usage errors', () => {
  const { project, outside } = fixture();
  try {
    const result = run(project, ['--write']);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /Usage:/);
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
