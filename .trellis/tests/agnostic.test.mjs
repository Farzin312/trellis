import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'check-agnostic.mjs');
const guidance = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/STRUCTURE.md',
  'docs/coding-standards.md',
  'docs/sdd/sdd.md',
  'docs/README-FOR-AGENTS.md',
  '.specify/memory/constitution.md',
];

function fixture() {
  const project = mkdtempSync(join(tmpdir(), 'trellis-agnostic-'));
  mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
  copyFileSync(source, join(project, '.trellis', 'scripts', 'check-agnostic.mjs'));
  for (const path of guidance) {
    mkdirSync(dirname(join(project, path)), { recursive: true });
    writeFileSync(join(project, path), '# Neutral guidance\n');
  }
  return project;
}

function run(project, args = []) {
  return spawnSync(process.execPath, [join(project, '.trellis', 'scripts', 'check-agnostic.mjs'), ...args], {
    cwd: project,
    encoding: 'utf8',
  });
}

test('neutral durable guidance passes and stack-specific defaults fail with location', () => {
  const project = fixture();
  try {
    const neutral = run(project);
    assert.equal(neutral.status, 0, neutral.stdout + neutral.stderr);
    assert.match(neutral.stdout, /PASS:/);

    writeFileSync(join(project, 'AGENTS.md'), 'Auth truth is Supabase Auth.\n');
    const specific = run(project);
    assert.equal(specific.status, 1, specific.stdout + specific.stderr);
    assert.match(specific.stderr, /AGENTS\.md:1/);
    assert.match(specific.stderr, /Supabase/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('missing canonical guidance fails and unknown options are usage errors', () => {
  const project = fixture();
  try {
    rmSync(join(project, 'docs', 'coding-standards.md'));
    const missing = run(project);
    assert.equal(missing.status, 1, missing.stdout + missing.stderr);
    assert.match(missing.stderr, /missing.*coding-standards/i);

    const unknown = run(project, ['--fix']);
    assert.equal(unknown.status, 2, unknown.stdout + unknown.stderr);
    assert.match(unknown.stderr, /Usage:/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
