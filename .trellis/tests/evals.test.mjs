import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'run-evals.mjs');

function fixture(selfTest = "import test from 'node:test'; test('self', () => {});\n") {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-evals-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(cwd, '.trellis', 'tests'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'run-evals.mjs'));
  writeFileSync(join(cwd, '.trellis', 'tests', 'self.test.mjs'), selfTest);
  return cwd;
}

function run(cwd, env = {}) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'run-evals.mjs')], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('required framework failures block and remain distinct from optional skips', () => {
  const cwd = fixture("import test from 'node:test'; test('self', () => { throw new Error('red'); });\n");
  try {
    const result = run(cwd);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, /FAIL required framework-self-tests/);
    assert.match(result.stdout, /RESULT required_pass=0 required_fail=1 optional_pass=0 optional_skip=1 optional_warn=0$/m);
    assert.doesNotMatch(result.stdout, /ALL .* PASSED/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('mixed manifests run every configured project test command', () => {
  const cwd = fixture();
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({
      scripts: { 'test:project': 'node project-check.mjs' },
    }));
    writeFileSync(join(cwd, 'project-check.mjs'), "console.log('JS_PROJECT_OK');\n");
    writeFileSync(join(cwd, 'go.mod'), 'module example.test/fixture\n\ngo 1.21\n');
    writeFileSync(join(cwd, 'widget_test.go'), 'package fixture\n');

    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const fakeGo = join(bin, 'go');
    writeFileSync(fakeGo, `#!${process.execPath}\nconsole.log('GO_PROJECT_OK');\n`);
    chmodSync(fakeGo, 0o755);

    const result = run(cwd, { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /PASS required framework-self-tests/);
    assert.match(result.stdout, /PASS required javascript-project-tests/);
    assert.match(result.stdout, /PASS required go-project-tests/);
    assert.match(result.stdout, /RESULT required_pass=3 required_fail=0 optional_pass=0 optional_skip=0 optional_warn=0$/m);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('missing commands skip while unconfigured test evidence warns', () => {
  const cwd = fixture();
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: {} }));
    writeFileSync(join(cwd, 'widget.test.js'), 'throw new Error("not configured");\n');
    writeFileSync(join(cwd, 'pyproject.toml'), '[project]\nname = "fixture"\n');

    const result = run(cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /WARN optional javascript-project-tests/);
    assert.match(result.stdout, /SKIP optional python-project-tests/);
    assert.match(result.stdout, /RESULT required_pass=1 required_fail=0 optional_pass=0 optional_skip=1 optional_warn=1$/m);
    assert.doesNotMatch(result.stdout, /ALL .* PASSED/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
