import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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

test('the npm archive contains the adopter product and excludes maintainer history and mirrors', { timeout: 15_000 }, () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const entries = JSON.parse(result.stdout)[0].files;
  const files = entries.map(({ path }) => path);
  assert.equal(entries.find(({ path }) => path === '.trellis/cli.mjs')?.mode, 0o755);
  assert.equal(entries.find(({ path }) => path === '.trellis/init.sh')?.mode, 0o755);
  for (const required of [
    '.agents/skills/sdd/SKILL.md',
    '.gitattributes',
    '.github/workflows/ci.yml',
    '.specify/templates/spec-template.md',
    '.trellis/cli.mjs',
    '.trellis/init.sh',
    '.trellis/services/docker-compose.phoenix.yml',
    '.trellis/tests/cli.test.mjs',
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'CHANGELOG.md',
    'docs/adopting-existing-projects.md',
  ]) assert.ok(files.includes(required), `missing from package: ${required}`);
  for (const path of files) {
    assert.doesNotMatch(path, /^(?:\.claude|\.specify\/specs|docs\/bug-fixes\/2026|graphify-out)(?:\/|$)/);
    assert.doesNotMatch(path, /^\.trellis\/(?:config\.json|generated-skills\.json|metrics)(?:\/|$)/);
    assert.doesNotMatch(path, /^\.trellis\/tests\/(?:package|public-docs|release|scaffold|scaffold-smoke)\.test\.mjs$/);
    assert.doesNotMatch(path, /^docs\/(?:frontend|ponytail-setup)/);
  }
});
