import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const scripts = join(root, '.trellis', 'scripts');

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-migrations-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  copyFileSync(join(scripts, 'check-migration-safety.mjs'), join(cwd, '.trellis', 'scripts', 'check-migration-safety.mjs'));
  copyFileSync(join(scripts, 'migration-adapters.json'), join(cwd, '.trellis', 'scripts', 'migration-adapters.json'));
  return cwd;
}

function run(cwd) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'check-migration-safety.mjs')], {
    cwd,
    encoding: 'utf8',
  });
}

test('an unmarked SQL directory does not fabricate multiple adapters', () => {
  const cwd = fixture();
  try {
    mkdirSync(join(cwd, 'migrations'));
    writeFileSync(join(cwd, 'migrations', '001_init.sql'), 'SELECT 1;\n');
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /SKIP: no unambiguous migration tool detected/);
    assert.doesNotMatch(result.stdout, /PASS:/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('config evidence selects one adapter and exact file patterns exclude suffix near-misses', () => {
  const cwd = fixture();
  try {
    mkdirSync(join(cwd, 'migrations'));
    writeFileSync(join(cwd, 'drizzle.config.ts'), 'export default {};\n');
    writeFileSync(join(cwd, 'migrations', '0001_init.sql'), 'SELECT 1;\n');
    writeFileSync(join(cwd, 'migrations', '0002_ignore.sql.bak'), 'SELECT 2;\n');
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /tool=drizzle files=1/);
    assert.doesNotMatch(result.stdout, /sql\.bak/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('markerless golang-migrate pairs are unambiguous only when exactly paired', () => {
  const cwd = fixture();
  try {
    mkdirSync(join(cwd, 'migrations'));
    writeFileSync(join(cwd, 'migrations', '001_init.up.sql'), 'SELECT 1;\n');
    writeFileSync(join(cwd, 'migrations', '001_init.down.sql'), 'SELECT 1;\n');
    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /tool=golang-migrate files=2/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('conflicting adapter configuration fails instead of double-counting files', () => {
  const cwd = fixture();
  try {
    mkdirSync(join(cwd, 'migrations'));
    writeFileSync(join(cwd, 'drizzle.config.ts'), 'export default {};\n');
    writeFileSync(join(cwd, 'atlas.hcl'), 'env "local" {}\n');
    writeFileSync(join(cwd, 'migrations', '0001_init.sql'), 'SELECT 1;\n');
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /FAIL: ambiguous migration tool evidence.*atlas.*drizzle/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('symlinked migration trees fail instead of scanning outside the project', () => {
  const cwd = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'trellis-migrations-outside-'));
  try {
    writeFileSync(join(cwd, 'drizzle.config.ts'), 'export default {};\n');
    writeFileSync(join(outside, '0001_secret.sql'), 'CREATE TABLE secret_customer_data (id int);\n');
    symlinkSync(outside, join(cwd, 'migrations'));
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /must be project-local and non-symlink/i);
    assert.doesNotMatch(result.stdout + result.stderr, /secret_customer_data/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
