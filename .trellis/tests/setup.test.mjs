import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const script = join(root, '.trellis', 'scripts', 'setup-plan.mjs');

function run(args, cwd = root) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
}

function answers(overrides = {}) {
  return {
    schema_version: 1,
    mode: 'new',
    target_directory: 'acme-app',
    project_name: 'Acme App',
    project_scope: 'A customer-facing application for managing Acme accounts.',
    stacks: ['typescript'],
    risk_surfaces: ['auth', 'personal-data'],
    project_gate: 'not-yet',
    needs: {
      semantic_graph: true,
      enforced_boundaries: false,
      local_observability: false,
    },
    external_tool_policy: {
      semantic_graph: 'install-approved',
      enforced_boundaries: 'not-selected',
      local_observability: 'not-selected',
    },
    tradeoffs_acknowledged: true,
    ...overrides,
  };
}

test('setup questions expose every mandatory answer and its decision context', () => {
  const result = run(['questions', '--json']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.schema_version, 1);
  assert.deepEqual(output.required_fields, Object.keys(answers()));
  assert.match(output.conditional_fields.target_directory, /mode=new/);
  assert.equal(output.answer_example.example_only, true);
  assert.equal(output.answer_example.value.schema_version, 1);
  assert.equal(output.questions.some(({ field }) => field === 'schema_version'), false);
  assert.deepEqual(Object.keys(output.answer_example.value.needs), Object.keys(answers().needs));
  assert.deepEqual(
    Object.keys(output.answer_example.value.external_tool_policy),
    Object.keys(answers().external_tool_policy),
  );
  assert.ok(output.questions.length >= 10);
  for (const question of output.questions) {
    assert.match(question.id, /^Q\d{2}$/);
    assert.ok(question.field);
    assert.ok(question.prompt);
    assert.ok(question.why);
  }
  const optional = output.questions.find(({ field }) => field === 'needs');
  assert.match(JSON.stringify(optional), /benefit/i);
  assert.match(JSON.stringify(optional), /drawback/i);
  const policy = output.questions.find(({ field }) => field === 'external_tool_policy');
  assert.equal(policy.choice_mode, 'one-per-capability');
  assert.deepEqual(policy.keys, Object.keys(answers().needs));
});

test('valid setup answers produce stable no-write JSON and human plans', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis setup '));
  try {
    const path = join(cwd, 'answers.json');
    writeFileSync(path, `${JSON.stringify(answers(), null, 2)}\n`);
    const before = readdirSync(cwd).sort();
    const first = run(['plan', `--answers=${path}`, '--json'], cwd);
    const second = run(['plan', `--answers=${path}`, '--json'], cwd);
    assert.equal(first.status, 0, first.stdout + first.stderr);
    assert.equal(second.status, 0, second.stdout + second.stderr);
    assert.equal(first.stdout, second.stdout);
    assert.deepEqual(readdirSync(cwd).sort(), before);
    const plan = JSON.parse(first.stdout);
    assert.equal(plan.profile.core, 'Trellis Core');
    assert.deepEqual(plan.profile.add_ons, ['Graphify']);
    assert.equal(plan.project.scope, answers().project_scope);
    assert.ok(plan.actions.some(({ command }) => command?.includes('graphifyy==0.9.10')));
    assert.ok(plan.actions.some(({ command }) => command?.includes('skills:generate')));
    assert.equal(plan.actions.find(({ id }) => id === 'record-project-context')?.blocking_review, true);
    assert.deepEqual(plan.actions.at(-1).command, ['npm', 'run', 'check']);
    assert.equal(new Set(plan.actions.map(({ id }) => id)).size, plan.actions.length);
    assert.equal(plan.writes_performed, false);

    const human = run(['plan', `--answers=${path}`], cwd);
    assert.equal(human.status, 0, human.stdout + human.stderr);
    assert.match(human.stdout, /Trellis Core \+ Graphify/);
    assert.match(human.stdout, /Benefit:/);
    assert.match(human.stdout, /Drawback:/);
    assert.match(human.stdout, /No files were changed/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('every mandatory setup answer is required', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-setup-required-'));
  try {
    for (const field of Object.keys(answers())) {
      const value = answers();
      delete value[field];
      const path = join(cwd, `${field}.json`);
      writeFileSync(path, JSON.stringify(value));
      const result = run(['plan', `--answers=${path}`, '--json'], cwd);
      assert.equal(result.status, 2, `${field}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, new RegExp(`missing.*${field}`, 'i'));
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('unsafe, contradictory, unresolved, oversized, and symlinked answers are rejected', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-setup-invalid-'));
  try {
    const cases = [
      ['unknown field', { ...answers(), invented: true }, /unknown field/i],
      ['unsafe target', answers({ target_directory: '../escape' }), /target_directory/i],
      ['unsafe display name', answers({ project_name: 'Acme/Other' }), /project_name/i],
      ['control display name', answers({ project_name: `Acme\u009bOther` }), /project_name/i],
      ['short scope', answers({ project_scope: 'too short' }), /project_scope/i],
      ['control scope', answers({ project_scope: `A customer-facing\u009b application scope.` }), /project_scope/i],
      ['mixed generic', answers({ stacks: ['generic', 'python'] }), /generic/i],
      ['mixed none risk', answers({ risk_surfaces: ['none', 'auth'] }), /none/i],
      ['unknown need', answers({ needs: { ...answers().needs, invented: false } }), /unknown field.*needs/i],
      ['missing need', answers({ needs: { semantic_graph: true, enforced_boundaries: false } }), /missing mandatory needs field/i],
      ['invalid need type', answers({ needs: { ...answers().needs, semantic_graph: 'yes' } }), /needs.semantic_graph must be boolean/i],
      ['unresolved dependency', answers({ external_tool_policy: { ...answers().external_tool_policy, semantic_graph: 'do-not-install' } }), /selected add-on semantic_graph/i],
      ['policy for unselected add-on', answers({ external_tool_policy: { ...answers().external_tool_policy, enforced_boundaries: 'already-installed' } }), /unselected add-on enforced_boundaries/i],
      ['unknown dependency policy', answers({ external_tool_policy: { ...answers().external_tool_policy, invented: 'not-selected' } }), /unknown field.*external_tool_policy/i],
      ['missing dependency policy', answers({ external_tool_policy: { semantic_graph: 'install-approved', enforced_boundaries: 'not-selected' } }), /missing mandatory external_tool_policy field/i],
      ['unacknowledged', answers({ tradeoffs_acknowledged: false }), /tradeoffs_acknowledged/i],
    ];
    for (const [name, value, expected] of cases) {
      const path = join(cwd, `${name.replaceAll(' ', '-')}.json`);
      writeFileSync(path, JSON.stringify(value));
      const result = run(['plan', `--answers=${path}`], cwd);
      assert.equal(result.status, 2, `${name}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, expected);
    }

    const oversized = join(cwd, 'oversized.json');
    writeFileSync(oversized, JSON.stringify({ ...answers(), padding: 'x'.repeat(70_000) }));
    const tooLarge = run(['plan', `--answers=${oversized}`], cwd);
    assert.equal(tooLarge.status, 2, tooLarge.stdout + tooLarge.stderr);
    assert.match(tooLarge.stderr, /64 KiB/i);

    const target = join(cwd, 'real-answers.json');
    const linked = join(cwd, 'linked-answers.json');
    writeFileSync(target, JSON.stringify(answers()));
    symlinkSync(target, linked);
    const symlinked = run(['plan', `--answers=${linked}`], cwd);
    assert.equal(symlinked.status, 2, symlinked.stdout + symlinked.stderr);
    assert.match(symlinked.stderr, /symbolic link/i);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('existing-repository plans make reviewed merging and project gates explicit', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-existing-plan-'));
  try {
    const value = answers({
      mode: 'existing',
      target_directory: undefined,
      project_gate: 'configured',
      needs: {
        semantic_graph: false,
        enforced_boundaries: true,
        local_observability: true,
      },
      external_tool_policy: {
        semantic_graph: 'not-selected',
        enforced_boundaries: 'already-installed',
        local_observability: 'already-installed',
      },
    });
    delete value.target_directory;
    const path = join(cwd, 'answers.json');
    writeFileSync(path, JSON.stringify(value));
    const result = run(['plan', `--answers=${path}`, '--json'], cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const plan = JSON.parse(result.stdout);
    assert.deepEqual(plan.profile.add_ons, ['Bounds', 'Phoenix']);
    assert.ok(plan.actions.some(({ id }) => id === 'review-brownfield-merge'));
    assert.ok(plan.actions.some(({ command }) => command?.includes('check:project')));
    assert.ok(plan.actions.some(({ command }) => command?.includes('preflight')));
    assert.ok(plan.actions.some(({ command }) => command?.includes('phoenix')));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('mixed per-tool dependency policies avoid redundant installation', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-mixed-policy-'));
  try {
    const value = answers({
      needs: {
        semantic_graph: true,
        enforced_boundaries: true,
        local_observability: false,
      },
      external_tool_policy: {
        semantic_graph: 'already-installed',
        enforced_boundaries: 'install-approved',
        local_observability: 'not-selected',
      },
    });
    const path = join(cwd, 'answers.json');
    writeFileSync(path, JSON.stringify(value));
    const result = run(['plan', `--answers=${path}`, '--json'], cwd);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const plan = JSON.parse(result.stdout);
    assert.deepEqual(plan.dependency_policy, value.external_tool_policy);
    assert.ok(plan.actions.some(({ id }) => id === 'verify-graphify-cli'));
    assert.equal(plan.actions.some(({ id }) => id === 'install-graphify'), false);
    assert.ok(plan.actions.some(({ id }) => id === 'prepare-pipx'));
    assert.ok(plan.actions.some(({ id }) => id === 'install-bounds'));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
