import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'docs-sync.mjs');

function fixture(guide) {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-docs-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(cwd, 'docs'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'docs-sync.mjs'));
  writeFileSync(join(cwd, 'docs', 'README.md'), '# Documentation\n');
  writeFileSync(join(cwd, 'docs', 'guide.md'), guide);
  return cwd;
}

function run(cwd, args = []) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'docs-sync.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('broken links and breadcrumbs fail in both accepted modes', () => {
  for (const args of [[], ['--check']]) {
    const cwd = fixture('# Guide\n\n[missing](missing.md)\n');
    try {
      const result = run(cwd, args);
      assert.equal(result.status, 1, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, /guide\.md.*missing.*Parent/i);
      assert.match(result.stderr, /guide\.md.*broken link.*missing\.md/i);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }
});

test('the default command is read-only and claims only structural validity', () => {
  const guide = '# Guide\n\n> Parent: [Documentation](README.md)\n\n'
    + '[section](#local) [external](https://example.com) [archive](archive.md#old) '
    + '`[example](not-a-real-link.md)`\n\n## Local\n';
  const cwd = fixture(guide);
  try {
    writeFileSync(join(cwd, 'docs', 'archive.md'), '# Archive\n\n> Parent: [Documentation](README.md)\n');
    const before = readFileSync(join(cwd, 'docs', 'guide.md'), 'utf8');
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readFileSync(join(cwd, 'docs', 'guide.md'), 'utf8'), before);
    assert.match(result.stdout, /PASS: documentation structure and local links valid/);
    assert.doesNotMatch(result.stdout, /sync|drift|accurate|truth/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('unknown options are usage errors', () => {
  const cwd = fixture('# Guide\n\n> Parent: [Documentation](README.md)\n');
  try {
    const result = run(cwd, ['--fix']);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /Usage:/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
