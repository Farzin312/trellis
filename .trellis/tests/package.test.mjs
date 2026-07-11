import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('package metadata has one publish-ready identity', () => {
  assert.equal(pkg.name, 'trellis-agent-toolkit');
  assert.equal(pkg.version, '0.1.0');
  assert.equal(pkg.private, false);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.bin?.trellis, './.trellis/cli.mjs');
  assert.equal(pkg.engines?.node, '>=20');
  assert.match(pkg.repository?.url || '', /Farzin312\/trellis/);
  assert.match(pkg.homepage || '', /Farzin312\/trellis/);
  assert.match(pkg.bugs?.url || '', /Farzin312\/trellis/);
});

test('core is dependency-free and has one aggregate gate', () => {
  assert.deepEqual(pkg.dependencies || {}, {});
  assert.deepEqual(pkg.devDependencies || {}, {});
  assert.ok(pkg.scripts?.check);
  assert.ok(pkg.scripts?.['test:self']);
  assert.equal(pkg.scripts?.test, 'node .trellis/scripts/run-evals.mjs');
});
