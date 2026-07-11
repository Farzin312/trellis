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

function fixture() {
  const project = mkdtempSync(join(tmpdir(), 'trellis-init-'));
  for (const path of [
    '.trellis/scripts',
    '.specify/memory',
    'docs',
  ]) mkdirSync(join(project, path), { recursive: true });

  cpSync(sourceInit, join(project, '.trellis', 'init.sh'));
  writeFileSync(join(project, 'AGENTS.md'), '# __PROJECT_NAME__\n');
  writeFileSync(join(project, 'package.json'), '{"name":"__PROJECT_SLUG__"}\n');
  writeFileSync(join(project, '.specify/memory/constitution.md'), '# __PROJECT_NAME__\n');
  writeFileSync(join(project, 'docs/STRUCTURE.md'), '# __PROJECT_NAME__\n');
  for (const script of ['check-mandate-sync.mjs', 'generate-skills.mjs']) {
    writeFileSync(join(project, '.trellis/scripts', script), 'process.exit(0);\n');
  }
  for (const script of ['adapt-to-project.mjs', 'config-core.mjs', 'config.mjs']) {
    cpSync(join(root, '.trellis', 'scripts', script), join(project, '.trellis', 'scripts', script));
  }
  spawnSync('git', ['init', '-q'], { cwd: project });
  return project;
}

function run(project, ...args) {
  return spawnSync('bash', ['.trellis/init.sh', ...args], {
    cwd: project,
    encoding: 'utf8',
    env: process.env,
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
    assert.match(result.stdout, /KEEP.*pre-commit/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('new initialization writes the canonical tierless config and honors explicit mixed stacks', () => {
  const project = fixture();
  try {
    writeFileSync(join(project, '.trellis/config.json.tmp'), 'USER FILE\n');
    const result = run(
      project,
      'New Project',
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
      enabled_integrations: ['graphify', 'bounds'],
    });
    assert.equal(existsSync(join(project, 'pytest.ini')), false);
    assert.equal(existsSync(join(project, 'mutmut.ini')), false);
    assert.equal(existsSync(join(project, 'docs/eval-setup-go.md')), false);
    assert.equal(readFileSync(join(project, '.trellis/config.json.tmp'), 'utf8'), 'USER FILE\n');
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('repeated initialization rejects a conflicting project identity instead of ignoring it', () => {
  const project = fixture();
  try {
    const config = `${JSON.stringify({
      schema_version: 1,
      project_name: 'Existing Project',
      project_slug: 'existing-project',
      stacks: ['javascript'],
      enabled_integrations: [],
    }, null, 2)}\n`;
    writeFileSync(join(project, '.trellis/config.json'), config);

    const result = run(project, 'Renamed Project');
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /identity.*already configured/i);
    assert.equal(readFileSync(join(project, '.trellis/config.json'), 'utf8'), config);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('auto-detection treats a package with tsconfig as TypeScript instead of duplicate JS and TS stacks', () => {
  const project = fixture();
  try {
    writeFileSync(join(project, 'tsconfig.json'), '{}\n');
    const result = run(project, 'TypeScript Project');
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const config = JSON.parse(readFileSync(join(project, '.trellis/config.json'), 'utf8'));
    assert.deepEqual(config.stacks, ['typescript']);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('repeated initialization applies only explicitly requested managed changes', () => {
  const project = fixture();
  try {
    writeFileSync(join(project, '.trellis/config.json'), `${JSON.stringify({
      schema_version: 1,
      project_name: 'Existing Project',
      project_slug: 'existing-project',
      stacks: ['javascript'],
      enabled_integrations: [],
      user_setting: 'keep',
    }, null, 2)}\n`);

    const result = run(project, '--stack=python', '--with-bounds');
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(JSON.parse(readFileSync(join(project, '.trellis/config.json'), 'utf8')), {
      schema_version: 1,
      project_name: 'Existing Project',
      project_slug: 'existing-project',
      stacks: ['python'],
      enabled_integrations: ['bounds'],
      user_setting: 'keep',
    });
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('removed tiers and malformed operands fail before project files change', () => {
  for (const args of [
    ['Project', '--tier=2'],
    ['Project', '--stack=unknown'],
    ['Project', '--stack='],
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
