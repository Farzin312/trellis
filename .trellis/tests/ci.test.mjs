import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('CI has one blocking aggregate workflow', () => {
  const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run check/);
  assert.match(ci, /node:\s*\[22, 24\]/);
  assert.match(ci, /actions\/checkout@[a-f0-9]{40}\s+# v4\.3\.1/);
  assert.match(ci, /actions\/setup-node@[a-f0-9]{40}\s+# v4\.4\.0/);
  assert.doesNotMatch(ci, /continue-on-error|\|\| true|node scripts\//);
  assert.equal(existsSync(new URL('../../.github/workflows/evals.yml', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../.github/workflows/bounds.yml', import.meta.url)), false);
});
