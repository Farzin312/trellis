import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('Claude imports the canonical mandate without duplicating it', () => {
  const claude = readFileSync(new URL('../../CLAUDE.md', import.meta.url), 'utf8').trim();
  assert.equal(claude, '@AGENTS.md');
});

test('mandate repair prepends the import and preserves Claude-specific instructions', () => {
  const project = mkdtempSync(join(tmpdir(), 'trellis-mandate-'));
  try {
    mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
    copyFileSync(
      new URL('../scripts/check-mandate-sync.mjs', import.meta.url),
      join(project, '.trellis', 'scripts', 'check-mandate-sync.mjs'),
    );
    writeFileSync(join(project, 'AGENTS.md'), '# Agent mandate\n');
    writeFileSync(join(project, 'CLAUDE.md'), '# Claude-only note\n\nKeep this.\n');
    const script = join(project, '.trellis', 'scripts', 'check-mandate-sync.mjs');

    const fixed = spawnSync(process.execPath, [script, '--fix'], { cwd: project, encoding: 'utf8' });
    assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
    assert.equal(
      readFileSync(join(project, 'CLAUDE.md'), 'utf8'),
      '@AGENTS.md\n\n# Claude-only note\n\nKeep this.\n',
    );

    const checked = spawnSync(process.execPath, [script], { cwd: project, encoding: 'utf8' });
    assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('mandate repair rejects symlinked policy files without changing their targets', () => {
  const project = mkdtempSync(join(tmpdir(), 'trellis-mandate-link-'));
  const outside = mkdtempSync(join(tmpdir(), 'trellis-mandate-outside-'));
  try {
    mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
    copyFileSync(
      new URL('../scripts/check-mandate-sync.mjs', import.meta.url),
      join(project, '.trellis', 'scripts', 'check-mandate-sync.mjs'),
    );
    writeFileSync(join(project, 'AGENTS.md'), '# Agent mandate\n');
    const target = join(outside, 'CLAUDE.md');
    writeFileSync(target, 'OUTSIDE\n');
    symlinkSync(target, join(project, 'CLAUDE.md'));
    const script = join(project, '.trellis', 'scripts', 'check-mandate-sync.mjs');

    const result = spawnSync(process.execPath, [script, '--fix'], { cwd: project, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /CLAUDE\.md.*non-symlink/i);
    assert.equal(readFileSync(target, 'utf8'), 'OUTSIDE\n');
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
