import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const cli = readFileSync(new URL('../cli.mjs', import.meta.url), 'utf8');

test('scaffold uses an explicit payload and atomic target publication', () => {
  assert.match(cli, /SCAFFOLD_PATHS/);
  assert.match(cli, /mkdtempSync/);
  assert.match(cli, /renameSync/);
  assert.doesNotMatch(cli, /cpSync\(templateRoot,\s*target/);
});

test('scaffold payload excludes source secrets, histories, and active specs', () => {
  assert.match(cli, /\.env\.example/);
  assert.doesNotMatch(cli, /SCAFFOLD_PATHS[\s\S]*\.specify\/specs/);
  assert.doesNotMatch(cli, /SCAFFOLD_PATHS[\s\S]*\.trellis\/metrics/);
  assert.doesNotMatch(cli, /SCAFFOLD_PATHS[\s\S]*docs\/bug-fixes\/2026/);
  assert.ok(root.endsWith('/trellis/'));
});
