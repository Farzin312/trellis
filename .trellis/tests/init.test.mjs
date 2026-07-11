import assert from 'node:assert/strict';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const sourceInit = join(root, '.trellis', 'init.sh');

function executable(path, body = 'exit 0') {
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(path, 0o755);
}

function fixture() {
  const project = mkdtempSync(join(tmpdir(), 'trellis-init-'));
  for (const path of [
    '.trellis/scripts',
    '.trellis/templates/js-ts',
    '.trellis/templates/python',
    '.trellis/templates/go',
    '.trellis/templates/rust',
    '.specify/memory',
    '.bounds',
    'docs',
    'bin',
  ]) mkdirSync(join(project, path), { recursive: true });

  cpSync(sourceInit, join(project, '.trellis', 'init.sh'));
  writeFileSync(join(project, 'AGENTS.md'), '# __PROJECT_NAME__\n');
  writeFileSync(join(project, 'package.json'), '{"name":"__PROJECT_SLUG__"}\n');
  writeFileSync(join(project, '.specify/memory/constitution.md'), '# __PROJECT_NAME__\n');
  writeFileSync(join(project, 'docs/STRUCTURE.md'), '# __PROJECT_NAME__\n');
  writeFileSync(join(project, '.bounds/root.yaml'), 'name: __PROJECT_SLUG__\nlanguages:\n  - typescript\n');

  writeFileSync(join(project, '.trellis/templates/js-ts/vitest.config.ts'), 'TRELLIS VITEST\n');
  writeFileSync(join(project, '.trellis/templates/js-ts/stryker.config.json'), 'TRELLIS STRYKER\n');
  writeFileSync(join(project, '.trellis/templates/python/pytest.ini'), 'TRELLIS PYTEST\n');
  writeFileSync(join(project, '.trellis/templates/python/mutmut.ini'), 'TRELLIS MUTMUT\n');
  writeFileSync(join(project, '.trellis/templates/go/README.md'), 'TRELLIS GO\n');
  writeFileSync(join(project, '.trellis/templates/rust/README.md'), 'TRELLIS RUST\n');

  for (const script of [
    'generate-commands.mjs',
    'check-mandate-sync.mjs',
    'adapt-to-project.mjs',
    'generate-skills.mjs',
  ]) writeFileSync(join(project, '.trellis/scripts', script), 'process.exit(0);\n');

  for (const command of ['npm', 'uv', 'pipx', 'graphify']) {
    executable(join(project, 'bin', command));
  }
  spawnSync('git', ['init', '-q'], { cwd: project });
  return project;
}

function run(project, ...args) {
  return spawnSync('bash', ['.trellis/init.sh', ...args], {
    cwd: project,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${join(project, 'bin')}:${process.env.PATH}` },
  });
}

test('repeated initialization preserves user configs, generated config, and Git hooks', () => {
  const project = fixture();
  try {
    const config = `${JSON.stringify({
      schema_version: 1,
      project_name: 'Existing Project',
      project_slug: 'existing-project',
      stacks: ['typescript'],
      active_agents: ['claude'],
      enabled_integrations: [],
      user_setting: 'keep',
    }, null, 2)}\n`;
    writeFileSync(join(project, '.trellis/config.json'), config);
    writeFileSync(join(project, 'vitest.config.ts'), 'USER VITEST\n');
    writeFileSync(join(project, 'stryker.config.json'), 'USER STRYKER\n');
    writeFileSync(join(project, '.git/hooks/pre-commit'), 'USER HOOK\n');
    chmodSync(join(project, '.git/hooks/pre-commit'), 0o755);

    const result = run(project);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(readFileSync(join(project, '.trellis/config.json'), 'utf8'), config);
    assert.equal(readFileSync(join(project, 'vitest.config.ts'), 'utf8'), 'USER VITEST\n');
    assert.equal(readFileSync(join(project, 'stryker.config.json'), 'utf8'), 'USER STRYKER\n');
    assert.equal(readFileSync(join(project, '.git/hooks/pre-commit'), 'utf8'), 'USER HOOK\n');
    assert.match(result.stdout, /KEEP.*vitest\.config\.ts/);
    assert.match(result.stdout, /KEEP.*pre-commit/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('new initialization writes the canonical tierless config and honors explicit mixed stacks', () => {
  const project = fixture();
  try {
    const result = run(
      project,
      'New Project',
      '--agents= claude, codex,claude ',
      '--stack=python,go',
      '--with-graphify',
      '--with-graphify',
      '--with-bounds',
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.deepEqual(JSON.parse(readFileSync(join(project, '.trellis/config.json'), 'utf8')), {
      schema_version: 1,
      project_name: 'New Project',
      project_slug: 'new-project',
      stacks: ['python', 'go'],
      active_agents: ['claude', 'codex'],
      enabled_integrations: ['graphify', 'bounds'],
    });
    assert.equal(readFileSync(join(project, 'pytest.ini'), 'utf8'), 'TRELLIS PYTEST\n');
    assert.equal(readFileSync(join(project, 'mutmut.ini'), 'utf8'), 'TRELLIS MUTMUT\n');
    assert.equal(readFileSync(join(project, 'docs/eval-setup-go.md'), 'utf8'), 'TRELLIS GO\n');
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('removed tiers and malformed operands fail before project files change', () => {
  for (const args of [
    ['Project', '--tier=2'],
    ['Project', '--stack=unknown'],
    ['Project', '--stack='],
    ['Project', '--agents=claude,unknown'],
    ['Project', '--unknown'],
  ]) {
    const project = fixture();
    try {
      const agents = readFileSync(join(project, 'AGENTS.md'), 'utf8');
      const result = run(project, ...args);
      assert.equal(result.status, 2, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
      assert.equal(readFileSync(join(project, 'AGENTS.md'), 'utf8'), agents);
      assert.equal(existsSync(join(project, '.trellis/config.json')), false);
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  }
});
