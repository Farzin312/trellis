import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../..', import.meta.url);

test('CI has one blocking aggregate workflow', () => {
  const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run check/);
  assert.doesNotMatch(ci, /continue-on-error|\|\| true|node scripts\//);
  assert.equal(existsSync(new URL('../../.github/workflows/evals.yml', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../.github/workflows/bounds.yml', import.meta.url)), false);
  assert.ok(root.pathname.endsWith('/trellis/'));
});
