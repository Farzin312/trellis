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

test('scaffold ships portable tests and project guidance, not Trellis release assertions', () => {
  const portableBlock = cli.match(/const PORTABLE_TESTS = \[([\s\S]*?)\n\];/)?.[1] || '';
  for (const name of ['cli.test.mjs', 'config.test.mjs', 'repo-map.test.mjs', 'skills.test.mjs']) {
    assert.match(portableBlock, new RegExp(name.replaceAll('.', '\\.')));
  }
  for (const name of ['package.test.mjs', 'public-docs.test.mjs', 'release.test.mjs', 'scaffold.test.mjs']) {
    assert.doesNotMatch(portableBlock, new RegExp(name.replaceAll('.', '\\.')));
  }
  assert.doesNotMatch(cli, /'docs\/(?:DESIGN|SYSTEM|evolution|ponytail-setup)\.md'/);
  assert.match(cli, /\.trellis\/scaffold/);
});
