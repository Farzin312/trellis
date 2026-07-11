import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'check-docs.mjs');

function fixture(guide) {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-docs-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(cwd, 'docs'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'check-docs.mjs'));
  writeFileSync(join(cwd, 'docs', 'README.md'), '# Documentation\n');
  writeFileSync(join(cwd, 'README.md'), '# Project\n\n[Docs](docs/README.md)\n');
  writeFileSync(join(cwd, 'docs', 'guide.md'), guide);
  return cwd;
}

function run(cwd, args = []) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'check-docs.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('broken links and breadcrumbs fail', () => {
  const cwd = fixture('# Guide\n\n[missing](missing.md)\n');
  try {
    const result = run(cwd);
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /guide\.md.*missing.*Parent/i);
    assert.match(result.stderr, /guide\.md.*broken link.*missing\.md/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('root documentation links are checked and angle-bracket paths with spaces work', () => {
  const cwd = fixture('# Guide\n\n> Parent: [Documentation](README.md)\n\n[space](<path with spaces.md>)\n');
  try {
    writeFileSync(join(cwd, 'docs', 'path with spaces.md'), '# Space\n\n> Parent: [Documentation](README.md)\n');
    writeFileSync(join(cwd, 'README.md'), '# Project\n\n[missing](missing.md)\n');
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /README\.md.*broken link.*missing\.md/i);
    assert.doesNotMatch(result.stderr, /path with spaces/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('links to existing files outside the repository fail as non-portable', () => {
  const cwd = fixture('# Guide\n\n> Parent: [Documentation](README.md)\n');
  const outside = `${cwd}-outside.md`;
  try {
    writeFileSync(outside, '# Local-only file\n');
    writeFileSync(join(cwd, 'README.md'), `# Project\n\n[outside](../${basename(outside)})\n`);
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /non-portable link outside repository/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(outside, { force: true });
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
    assert.match(result.stdout, /PASS: documentation structure and local file links valid/);
    assert.doesNotMatch(result.stdout, /sync|drift|accurate|truth/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('unknown options are usage errors', () => {
  const cwd = fixture('# Guide\n\n> Parent: [Documentation](README.md)\n');
  try {
    const result = run(cwd, ['--check']);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    assert.match(result.stderr, /Usage:/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('symlinked root documentation is rejected instead of read outside the project', () => {
  const cwd = fixture('# Guide\n\n> Parent: [Documentation](README.md)\n');
  const outside = mkdtempSync(join(tmpdir(), 'trellis-docs-outside-'));
  try {
    rmSync(join(cwd, 'README.md'));
    writeFileSync(join(outside, 'README.md'), '# Outside private documentation\n');
    symlinkSync(join(outside, 'README.md'), join(cwd, 'README.md'));
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /README\.md.*regular non-symlink/i);
    assert.doesNotMatch(result.stdout + result.stderr, /Outside private documentation/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
