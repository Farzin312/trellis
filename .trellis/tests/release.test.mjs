import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;

test('retired unsupported surfaces are absent', () => {
  for (const path of [
    '.trellis/scripts/golden-tests.mjs',
    '.trellis/scripts/generate-commands.mjs',
    '.trellis/scripts/check-command-sync.mjs',
    '.trellis/scripts/check-skill-sync.mjs',
    '.trellis/scripts/check-graph-freshness.mjs',
    '.trellis/scripts/model-pricing.json',
    '.github/workflows/evals.yml',
    '.github/workflows/bounds.yml',
  ]) assert.equal(existsSync(join(root, path)), false, path);
});

test('public and active policy surfaces contain no fake tiers or template identity', () => {
  for (const path of ['README.md', 'AGENTS.md', 'docs/README.md', 'package.json', '.trellis/init.sh', '.trellis/cli.mjs']) {
    const content = readFileSync(join(root, path), 'utf8');
    assert.doesNotMatch(content, /__PROJECT_(?:NAME|SLUG)__|ai-ready-scaffold|Tier [123]|--tier/);
  }
});
