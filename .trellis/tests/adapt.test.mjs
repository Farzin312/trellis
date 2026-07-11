import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const sourceScript = join(root, '.trellis', 'scripts', 'adapt-to-project.mjs');

function fixture(extraFiles = {}) {
  const project = mkdtempSync(join(tmpdir(), 'trellis-adapt-'));
  mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(project, '.specify', 'memory'), { recursive: true });
  mkdirSync(join(project, '.bounds'), { recursive: true });
  cpSync(sourceScript, join(project, '.trellis', 'scripts', 'adapt-to-project.mjs'));
  cpSync(
    join(root, '.trellis', 'scripts', 'config-core.mjs'),
    join(project, '.trellis', 'scripts', 'config-core.mjs'),
  );
  writeFileSync(join(project, '.trellis', 'config.json'), JSON.stringify({
    schema_version: 1,
    project_name: 'Project',
    project_slug: 'project',
    stacks: ['generic'],
    enabled_integrations: [],
  }));
  writeFileSync(
    join(project, 'AGENTS.md'),
    '# Project\n\nThis repo owns: [describe what this project is — fill in after init].\n\nUser notes stay.\n',
  );
  writeFileSync(
    join(project, '.specify', 'memory', 'constitution.md'),
    'USER CONSTITUTION\nAuth truth is your auth provider (e.g., Supabase Auth).\n',
  );
  writeFileSync(join(project, '.bounds', 'root.yaml'), 'languages:\n  - typescript\n');
  for (const [path, content] of Object.entries(extraFiles)) {
    const target = join(project, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return project;
}

function run(project, ...args) {
  return spawnSync(process.execPath, ['.trellis/scripts/adapt-to-project.mjs', ...args], {
    cwd: project,
    encoding: 'utf8',
  });
}

test('explicit stacks adapt Trellis-managed scope and preserve external tool configuration', () => {
  const project = fixture();
  try {
    const constitution = readFileSync(join(project, '.specify/memory/constitution.md'), 'utf8');
    const bounds = readFileSync(join(project, '.bounds/root.yaml'), 'utf8');
    const first = run(project, '--stack=python');
    assert.equal(first.status, 0, first.stderr);
    assert.match(readFileSync(join(project, 'AGENTS.md'), 'utf8'), /built with python/);
    assert.equal(readFileSync(join(project, '.bounds/root.yaml'), 'utf8'), bounds);
    assert.equal(readFileSync(join(project, '.specify/memory/constitution.md'), 'utf8'), constitution);

    const snapshot = [
      readFileSync(join(project, 'AGENTS.md'), 'utf8'),
      readFileSync(join(project, '.bounds/root.yaml'), 'utf8'),
    ];
    const repeat = run(project, '--stack=python');
    assert.equal(repeat.status, 0, repeat.stderr);
    assert.deepEqual([
      readFileSync(join(project, 'AGENTS.md'), 'utf8'),
      readFileSync(join(project, '.bounds/root.yaml'), 'utf8'),
    ], snapshot);

    const changed = run(project, '--stack=go,rust');
    assert.equal(changed.status, 0, changed.stderr);
    assert.match(readFileSync(join(project, 'AGENTS.md'), 'utf8'), /built with go, rust/);
    assert.equal(readFileSync(join(project, '.bounds/root.yaml'), 'utf8'), bounds);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('unknown or malformed explicit stacks fail before modifying files', () => {
  for (const value of ['unknown', 'python,,go', 'generic,python']) {
    const project = fixture();
    try {
      const before = [
        readFileSync(join(project, 'AGENTS.md'), 'utf8'),
        readFileSync(join(project, '.bounds/root.yaml'), 'utf8'),
      ];
      const result = run(project, `--stack=${value}`);
      assert.equal(result.status, 2, `${value}\n${result.stdout}\n${result.stderr}`);
      assert.deepEqual([
        readFileSync(join(project, 'AGENTS.md'), 'utf8'),
        readFileSync(join(project, '.bounds/root.yaml'), 'utf8'),
      ], before);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }
});

test('auto-detection reports every root language and falls back to generic', () => {
  const mixed = fixture({
    'package.json': '{"devDependencies":{"typescript":"5.0.0"}}\n',
    'tsconfig.json': '{}\n',
    'pyproject.toml': '[project]\nname = "example"\n',
    'go.mod': 'module example.test/project\n',
    'Cargo.toml': '[package]\nname = "example"\n',
  });
  const generic = fixture();
  try {
    const result = run(mixed);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /typescript, python, go, rust/);
    assert.match(readFileSync(join(mixed, 'AGENTS.md'), 'utf8'), /built with typescript, python, go, rust/);

    const genericResult = run(generic);
    assert.equal(genericResult.status, 0, genericResult.stderr);
    assert.match(readFileSync(join(generic, 'AGENTS.md'), 'utf8'), /built with generic/);
  } finally {
    rmSync(mixed, { recursive: true, force: true });
    rmSync(generic, { recursive: true, force: true });
  }
});

test('adaptation fails when the canonical Trellis configuration is missing', () => {
  const project = fixture();
  try {
    rmSync(join(project, '.trellis', 'config.json'));
    const agents = readFileSync(join(project, 'AGENTS.md'), 'utf8');
    const result = run(project, '--stack=python');
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /missing \.trellis\/config\.json/i);
    assert.equal(readFileSync(join(project, 'AGENTS.md'), 'utf8'), agents);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
