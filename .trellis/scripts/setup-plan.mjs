#!/usr/bin/env node
/** Validate mandatory adoption answers and render a read-only setup plan. */

import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STACKS } from './config-core.mjs';

const MAX_ANSWERS_BYTES = 64 * 1024;
const ROOT_FIELDS = [
  'schema_version',
  'mode',
  'target_directory',
  'project_name',
  'project_scope',
  'stacks',
  'risk_surfaces',
  'project_gate',
  'needs',
  'external_tool_policy',
  'tradeoffs_acknowledged',
];
const NEED_FIELDS = ['semantic_graph', 'enforced_boundaries', 'local_observability'];
const RISKS = ['none', 'auth', 'payments', 'personal-data', 'secrets', 'database', 'deployment'];
const TOOL_POLICIES = ['already-installed', 'install-approved', 'do-not-install'];
const NOT_SELECTED = 'not-selected';
const BOUNDS_SOURCE = 'git+https://github.com/Farzin312/bounds.git@a504befeeea7448791538e2a6f8ad1f2259932eb';

const questions = [
  {
    id: 'Q01', field: 'mode', prompt: 'Is this a new project or an existing repository?', why: 'New scaffolds are atomic; existing policy and CI require a reviewed merge.', choices: [{ value: 'new', label: 'New project' }, { value: 'existing', label: 'Existing repository' }],
  },
  {
    id: 'Q02', field: 'target_directory', prompt: 'What safe child-directory name should a new project use?', why: 'The target must not traverse or overwrite an existing path.', choices: [{ value: '<basename>', label: 'Required only for mode=new' }],
  },
  {
    id: 'Q03', field: 'project_name', prompt: 'What human-readable project name should guidance use?', why: 'Project identity must remain stable across config and generated docs.', choices: [{ value: '<display name>', label: '1-200 characters' }],
  },
  {
    id: 'Q04', field: 'project_scope', prompt: 'What does this repository own?', why: 'Concrete scope stops agents from inventing product and subsystem responsibility.', choices: [{ value: '<10-500 character purpose>', label: 'Required free text' }],
  },
  {
    id: 'Q05', field: 'stacks', prompt: 'Which root stacks are actually present?', why: 'Stack choices control tested fallback commands and generated guidance.', choices: STACKS.map((value) => ({ value, label: value }))
  },
  {
    id: 'Q06', field: 'risk_surfaces', prompt: 'Which trust-sensitive surfaces exist?', why: 'Auth, money, data, secrets, and deployment need fail-closed project-owned review.', choices: RISKS.map((value) => ({ value, label: value }))
  },
  {
    id: 'Q07', field: 'project_gate', prompt: 'Is one complete check:project command already configured?', why: 'Without it, the Trellis aggregate cannot prove build, lint, type, test, migration, browser, and integration behavior.', choices: [{ value: 'configured', label: 'Configured and complete' }, { value: 'not-yet', label: 'Explicit follow-up required' }],
  },
  {
    id: 'Q08', field: 'needs', prompt: 'Which optional capabilities solve a current need?', why: 'Add-ons have a benefit and a maintenance drawback; they are not product tiers.', choices: [
      { value: 'semantic_graph', label: 'Graphify', benefit: 'Deeper symbol and relationship queries.', drawback: 'Python tool, generated graph, skill sync, and CI upkeep.' },
      { value: 'enforced_boundaries', label: 'Bounds', benefit: 'Verified ownership and boundary drift gates.', drawback: 'Requires curated manifests, full coverage, and intentional re-baselining.' },
      { value: 'local_observability', label: 'Phoenix', benefit: 'Local trace inspection after instrumentation.', drawback: 'Requires Docker, ports, storage, and project-owned telemetry code.' },
    ],
  },
  {
    id: 'Q09', field: 'external_tool_policy', prompt: 'How may each selected external dependency be handled?', why: 'Global downloads and Docker are independent external state changes and require capability-specific authority.', choice_mode: 'one-per-capability', keys: NEED_FIELDS, choices: [...TOOL_POLICIES, NOT_SELECTED].map((value) => ({ value, label: value })),
  },
  {
    id: 'Q10', field: 'tradeoffs_acknowledged', prompt: 'Have the add-on costs and ownership boundaries been reviewed?', why: 'Setup must not turn a recommendation into uninformed consent.', choices: [{ value: true, label: 'Reviewed and acknowledged' }, { value: false, label: 'Stop before planning' }],
  },
];

const exampleAnswers = {
  schema_version: 1,
  mode: 'new',
  target_directory: 'example-project',
  project_name: 'Example Project',
  project_scope: 'Replace this text with the concrete responsibility of the repository.',
  stacks: ['generic'],
  risk_surfaces: ['none'],
  project_gate: 'not-yet',
  needs: {
    semantic_graph: false,
    enforced_boundaries: false,
    local_observability: false,
  },
  external_tool_policy: {
    semantic_graph: NOT_SELECTED,
    enforced_boundaries: NOT_SELECTED,
    local_observability: NOT_SELECTED,
  },
  tradeoffs_acknowledged: true,
};

class ValidationError extends Error {}

function invalid(message) {
  throw new ValidationError(message);
}

function exactKeys(value, expected, label) {
  if (!value || Array.isArray(value) || typeof value !== 'object') invalid(`${label} must be an object`);
  const unknown = Object.keys(value).filter((field) => !expected.includes(field));
  if (unknown.length) invalid(`unknown field in ${label}: ${unknown[0]}`);
}

function stringArray(value, field, allowed) {
  if (!Array.isArray(value) || value.length === 0) invalid(`${field} must be a non-empty array`);
  if (value.some((entry) => typeof entry !== 'string' || !allowed.includes(entry))) {
    invalid(`${field} contains an unsupported value`);
  }
  if (new Set(value).size !== value.length) invalid(`${field} contains duplicates`);
  return [...value];
}

function validate(value) {
  exactKeys(value, ROOT_FIELDS, 'setup answers');
  for (const field of ROOT_FIELDS.filter((field) => field !== 'target_directory')) {
    if (!(field in value)) invalid(`missing mandatory field: ${field}`);
  }
  if (value.schema_version !== 1) invalid('schema_version must equal 1');
  if (!['new', 'existing'].includes(value.mode)) invalid('mode must be new or existing');
  if (value.mode === 'new') {
    if (!('target_directory' in value)) invalid('missing mandatory field: target_directory');
    if (typeof value.target_directory !== 'string' || value.target_directory.length > 200
      || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.target_directory)
      || ['.', '..'].includes(value.target_directory)) {
      invalid('target_directory must be a safe child-directory basename of at most 200 characters');
    }
  } else if ('target_directory' in value) {
    invalid('target_directory must be omitted when mode is existing');
  }
  if (typeof value.project_name !== 'string' || !value.project_name.trim()
    || value.project_name !== value.project_name.trim() || value.project_name.length > 200
    || /[\\/\p{Cc}]/u.test(value.project_name)) {
    invalid('project_name must be a trimmed 1-200 character display name without slashes or controls');
  }
  if (typeof value.project_scope !== 'string' || value.project_scope !== value.project_scope.trim()
    || value.project_scope.length < 10 || value.project_scope.length > 500
    || /\p{Cc}/u.test(value.project_scope)) {
    invalid('project_scope must be trimmed and contain 10-500 characters without controls');
  }
  const stacks = stringArray(value.stacks, 'stacks', STACKS);
  if (stacks.includes('generic') && stacks.length > 1) invalid('generic cannot be combined with another stack');
  const riskSurfaces = stringArray(value.risk_surfaces, 'risk_surfaces', RISKS);
  if (riskSurfaces.includes('none') && riskSurfaces.length > 1) invalid('none cannot be combined with another risk surface');
  if (!['configured', 'not-yet'].includes(value.project_gate)) {
    invalid('project_gate must be configured or not-yet');
  }
  exactKeys(value.needs, NEED_FIELDS, 'needs');
  for (const field of NEED_FIELDS) {
    if (!(field in value.needs)) invalid(`missing mandatory needs field: ${field}`);
    if (typeof value.needs[field] !== 'boolean') invalid(`needs.${field} must be boolean`);
  }
  exactKeys(value.external_tool_policy, NEED_FIELDS, 'external_tool_policy');
  for (const field of NEED_FIELDS) {
    if (!(field in value.external_tool_policy)) {
      invalid(`missing mandatory external_tool_policy field: ${field}`);
    }
    const policy = value.external_tool_policy[field];
    if (value.needs[field] && !['already-installed', 'install-approved'].includes(policy)) {
      invalid(`selected add-on ${field} requires already-installed or install-approved`);
    }
    if (!value.needs[field] && policy !== NOT_SELECTED) {
      invalid(`unselected add-on ${field} requires external_tool_policy=${NOT_SELECTED}`);
    }
  }
  if (value.tradeoffs_acknowledged !== true) invalid('tradeoffs_acknowledged must be true');
  return {
    schema_version: 1,
    mode: value.mode,
    ...(value.mode === 'new' ? { target_directory: value.target_directory } : {}),
    project_name: value.project_name,
    project_scope: value.project_scope,
    stacks,
    risk_surfaces: riskSurfaces,
    project_gate: value.project_gate,
    needs: Object.fromEntries(NEED_FIELDS.map((field) => [field, value.needs[field]])),
    external_tool_policy: Object.fromEntries(
      NEED_FIELDS.map((field) => [field, value.external_tool_policy[field]]),
    ),
    tradeoffs_acknowledged: true,
  };
}

function readAnswers(input) {
  const path = resolve(input);
  let details;
  try {
    details = lstatSync(path);
  } catch (error) {
    throw new Error(`cannot inspect answers file: ${error.message}`);
  }
  if (details.isSymbolicLink()) invalid('answers file must not be a symbolic link');
  if (!details.isFile()) invalid('answers path must be a regular file');
  if (details.size > MAX_ANSWERS_BYTES) invalid('answers file exceeds 64 KiB');
  let value;
  try {
    value = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    invalid(`answers file is not valid JSON: ${error.message}`);
  }
  return validate(value);
}

function action(id, title, command = null, extra = {}) {
  return { id, title, command, ...extra };
}

function buildPlan(answers) {
  const addOns = [];
  if (answers.needs.semantic_graph) addOns.push('Graphify');
  if (answers.needs.enforced_boundaries) addOns.push('Bounds');
  if (answers.needs.local_observability) addOns.push('Phoenix');
  const actions = [];
  const stack = `--stack=${answers.stacks.join(',')}`;
  if (answers.mode === 'new') {
    actions.push(action('create-core', 'Create the atomic Trellis core scaffold', [
      'trellis', 'new', answers.target_directory, stack,
    ]));
  } else {
    actions.push(action(
      'review-brownfield-merge',
      'Create a reference scaffold and review every merge conflict using docs/adopting-existing-projects.md',
      null,
      { blocking_review: true },
    ));
    actions.push(action('configure-core', 'Configure the reviewed Trellis checkout', [
      'trellis', 'init', answers.project_name, stack,
    ]));
  }

  actions.push(action(
    'record-project-context',
    `Record project scope and risk surfaces in the managed AGENTS.md context: ${answers.project_scope}`,
    null,
    { risk_surfaces: answers.risk_surfaces, blocking_review: true },
  ));
  if (answers.project_gate === 'configured') {
    actions.push(action('verify-project-gate', 'Run the complete project-owned gate', ['npm', 'run', 'check:project']));
  } else {
    actions.push(action(
      'configure-project-gate',
      'Define check:project before treating the aggregate as complete',
      null,
      { blocking_follow_up: true },
    ));
  }

  if (answers.needs.semantic_graph) {
    const installing = answers.external_tool_policy.semantic_graph === 'install-approved';
    if (installing) {
      actions.push(action('prepare-uv', 'Install or verify uv using reviewed operating-system instructions', null, { external_platform_step: true }));
    }
    actions.push(installing
      ? action('install-graphify', 'Install the reviewed Graphify version', ['uv', 'tool', 'install', 'graphifyy==0.9.10'])
      : action('verify-graphify-cli', 'Verify the already-installed Graphify CLI', ['graphify', '--version']));
    actions.push(action('install-graphify-skill', 'Install the project-scoped cross-agent Graphify skill', ['graphify', 'install', '--project', '--platform', 'agents']));
    actions.push(action('mirror-graphify-skill', 'Regenerate the Claude compatibility mirror', ['npm', 'run', 'skills:generate']));
    actions.push(action('enable-graphify', 'Enable Graphify only after CLI and skill readiness', ['trellis', 'config', 'enable', 'graphify']));
    actions.push(action('build-graph', 'Build the project-root graph', ['trellis', 'graph']));
    actions.push(action('verify-graphify-artifact', 'Verify the configured graph artifact', ['npm', 'run', 'check:integrations']));
  }
  if (answers.needs.enforced_boundaries) {
    const installing = answers.external_tool_policy.enforced_boundaries === 'install-approved';
    if (installing) {
      actions.push(action('prepare-pipx', 'Install or verify pipx using reviewed operating-system instructions', null, { external_platform_step: true }));
    }
    actions.push(installing
      ? action('install-bounds', 'Install the reviewed Bounds source commit', ['pipx', 'install', BOUNDS_SOURCE])
      : action('verify-bounds', 'Verify the already-installed Bounds CLI', ['bounds', '--version']));
    actions.push(action('guide-bounds', 'Read the current state-aware setup plan', ['bounds', 'guide']));
    actions.push(action('initialize-bounds', 'Create Bounds-owned configuration', ['bounds', 'init', '--root']));
    actions.push(action('discover-bounds', 'Generate a draft ownership map for review', ['bounds', 'discover', '--apply']));
    actions.push(action('review-bounds', 'Review subsystem paths, public surfaces, dependencies, and coverage; discovery can be wrong', null, { blocking_review: true }));
    actions.push(action('verify-bounds-coverage', 'Require complete supported-source ownership', ['bounds', 'coverage']));
    actions.push(action('verify-bounds-preflight', 'Require boundary and ownership readiness', ['bounds', 'preflight', '--fail-on-unowned']));
    actions.push(action('enable-bounds', 'Enable Bounds only after reviewed preflight passes', ['trellis', 'config', 'enable', 'bounds']));
  }
  if (answers.needs.local_observability) {
    const installing = answers.external_tool_policy.local_observability === 'install-approved';
    actions.push(installing
      ? action('install-docker', 'Install Docker with Compose using the operating system vendor instructions', null, { external_platform_step: true })
      : action('verify-docker', 'Verify Docker and Compose are available', ['docker', 'info']));
    actions.push(action('start-phoenix', 'Start the pinned localhost-only Phoenix service', ['trellis', 'services', 'start', 'phoenix']));
    actions.push(action('instrument-project', 'Add project-owned OpenTelemetry or Phoenix SDK instrumentation; the container alone emits no traces', null, { blocking_follow_up: true }));
  }
  actions.push(action('verify-complete-setup', 'Run the single Trellis aggregate and inspect every warning or skip', ['npm', 'run', 'check']));

  return {
    schema_version: 1,
    profile: {
      core: 'Trellis Core',
      add_ons: addOns,
      label: ['Trellis Core', ...addOns].join(' + '),
    },
    project: {
      mode: answers.mode,
      ...(answers.mode === 'new' ? { target_directory: answers.target_directory } : {}),
      name: answers.project_name,
      scope: answers.project_scope,
      stacks: answers.stacks,
      risk_surfaces: answers.risk_surfaces,
      project_gate: answers.project_gate,
    },
    tradeoffs: [
      { capability: 'Trellis Core', benefit: 'Portable agent guidance, SDD, checks, and a cheap map with no paid service.', drawback: 'Project-specific gates and trust boundaries still require owner input.' },
      ...(answers.needs.semantic_graph ? [{ capability: 'Graphify', benefit: 'Deeper symbol and relationship queries.', drawback: 'Adds a Python tool, generated artifact, agent skill, and CI upkeep.' }] : []),
      ...(answers.needs.enforced_boundaries ? [{ capability: 'Bounds', benefit: 'Verified ownership and boundary drift gates.', drawback: 'Manifests require review, complete coverage, and intentional maintenance.' }] : []),
      ...(answers.needs.local_observability ? [{ capability: 'Phoenix', benefit: 'Local trace inspection after instrumentation.', drawback: 'Adds Docker, ports, storage, and project-owned telemetry work.' }] : []),
    ],
    dependency_policy: answers.external_tool_policy,
    actions,
    writes_performed: false,
  };
}

function printQuestions(json) {
  const output = {
    schema_version: 1,
    required_fields: ROOT_FIELDS,
    conditional_fields: { target_directory: 'required only when mode=new; omit when mode=existing' },
    questions,
    answer_example: {
      example_only: true,
      instruction: 'Replace every project-specific value; this is a shape example, not a recommended answer.',
      value: exampleAnswers,
    },
  };
  if (json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }
  console.log('TRELLIS GUIDED SETUP — MANDATORY QUESTIONS');
  for (const question of questions) {
    console.log(`\n${question.id} ${question.prompt}`);
    console.log(`Why: ${question.why}`);
    if (question.keys) console.log(`Apply one choice independently to: ${question.keys.join(', ')}`);
    question.choices.forEach((choice, index) => {
      const letter = String.fromCharCode(65 + index);
      console.log(`${letter}. ${choice.label}${choice.benefit ? ` — Benefit: ${choice.benefit} Drawback: ${choice.drawback}` : ''}`);
    });
  }
  console.log('\nJSON answer shape (example only; replace every project-specific value)');
  console.log(JSON.stringify(exampleAnswers, null, 2));
  console.log('\nNo setup plan is available until every required answer is explicit.');
}

function printPlan(plan, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return;
  }
  console.log(`TRELLIS SETUP PLAN — ${plan.profile.label}`);
  console.log(`Project: ${plan.project.name} (${plan.project.mode}; ${plan.project.stacks.join(', ')})`);
  console.log(`Scope: ${plan.project.scope}`);
  console.log(`Risk surfaces: ${plan.project.risk_surfaces.join(', ')}`);
  console.log('\nTrade-offs');
  for (const item of plan.tradeoffs) {
    console.log(`- ${item.capability} — Benefit: ${item.benefit} Drawback: ${item.drawback}`);
  }
  console.log('\nOrdered actions');
  plan.actions.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    if (item.command) console.log(`   ${item.command.map((part) => JSON.stringify(part)).join(' ')}`);
  });
  console.log('\nNo files were changed. Execute only after final user approval.');
}

function usage(message) {
  if (message) console.error(`USAGE: ${message}`);
  console.error('Usage: setup-plan.mjs questions [--json] | plan --answers=<path> [--json]');
  process.exit(2);
}

const [command, ...args] = process.argv.slice(2);
const json = args.includes('--json');
if (args.filter((arg) => arg === '--json').length > 1) usage('--json may only be provided once');

try {
  if (command === 'questions') {
    if (args.some((arg) => arg !== '--json')) usage('questions accepts only --json');
    printQuestions(json);
  } else if (command === 'plan') {
    const answerArgs = args.filter((arg) => arg.startsWith('--answers='));
    if (answerArgs.length !== 1 || args.some((arg) => arg !== '--json' && !arg.startsWith('--answers='))) {
      usage('plan requires exactly one --answers=<path> and optional --json');
    }
    const path = answerArgs[0].slice('--answers='.length);
    if (!path) usage('--answers requires a path');
    printPlan(buildPlan(readAnswers(path)), json);
  } else {
    usage('expected questions or plan');
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`USAGE: invalid setup answers: ${error.message}`);
    process.exit(2);
  }
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
