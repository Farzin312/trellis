#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './scripts/config-core.mjs';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const AI = process.argv.includes('--ai') || process.env.TRELLIS_AI === '1';
const argv = process.argv.slice(2).filter((arg) => arg !== '--ai');
const [command, ...args] = argv;
const STACKS = new Set(['generic', 'javascript', 'typescript', 'python', 'go', 'rust']);

// Explicit product payload. Never replace this with a live-worktree denylist.
const SCAFFOLD_PATHS = [
  '.agents',
  '.env.example',
  '.github/workflows/ci.yml',
  '.specify/memory',
  '.specify/templates',
  '.trellis/LICENSE',
  '.trellis/cli.mjs',
  '.trellis/init.sh',
  '.trellis/scaffold',
  '.trellis/scripts',
  '.trellis/services',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/README-FOR-AGENTS.md',
  'docs/STRUCTURE.md',
  'docs/_subsystem-template.md',
  'docs/bug-fixes/README.md',
  'docs/bug-fixes/_template.md',
  'docs/coding-standards.md',
  'docs/credits.md',
  'docs/evals.md',
  'docs/language-support.md',
  'docs/metrics.md',
  'docs/repository-mapping.md',
  'docs/sdd',
  'docs/self-hosted-services.md',
  'docs/skills.md',
  'package.json',
];
const PORTABLE_TESTS = [
  'adapt.test.mjs',
  'agnostic.test.mjs',
  'ci.test.mjs',
  'cli.test.mjs',
  'config.test.mjs',
  'docs.test.mjs',
  'evals.test.mjs',
  'init.test.mjs',
  'integrations.test.mjs',
  'mandate.test.mjs',
  'metrics.test.mjs',
  'migrations.test.mjs',
  'repo-map.test.mjs',
  'sdd-skills.test.mjs',
  'services.test.mjs',
  'skills.test.mjs',
  'wizard.test.mjs',
];

const HELP = AI
  ? `TRELLIS CLI [ai]. exit 0=success, 1=operation failed, 2=invalid usage.
new <name> [--stack=x] [--with-graphify] [--with-bounds] create a curated child scaffold atomically.
init [name] [--stack=x] [--with-graphify] [--with-bounds] configure this Trellis checkout.
check             run the repository's single aggregate gate.
eval              run required framework tests and configured project evals.
map [--json]      print a bounded, read-only structural repository map.
config show|enable|disable [integration] inspect or manage optional integrations.
graph [path]       build or refresh the configured Graphify code graph.
metrics [--recent|--raw] summarize the optional local run ledger.
evolve [--stack=x]       re-run deterministic project adaptation.
services start|stop|status|ports [phoenix] manage the optional service.
spec              show how to start the SDD skill flow.
version           print Trellis version.
`
  : `Trellis — repository-local AI workflow scaffold

Usage:
  trellis new <name> [--stack=x] [--with-graphify] [--with-bounds]
  trellis init [name] [--stack=x] [--with-graphify] [--with-bounds]
  trellis check | eval | map | config | graph | metrics | evolve | services | spec
  trellis version | --version

Run "trellis help --ai" for the compact command contract.
`;

function usage(message) {
  if (message) console.error(AI ? `USAGE: ${message}` : `Invalid usage: ${message}`);
  process.exitCode = 2;
}

function fail(message) {
  console.error(AI ? `FAIL: ${message}` : message);
  process.exitCode = 1;
}

function run(file, fileArgs = [], options = {}) {
  try {
    execFileSync(file, fileArgs, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, ...(AI ? { TRELLIS_AI: '1' } : {}) },
      ...options,
    });
    return true;
  } catch {
    fail(`${basename(file)} failed`);
    return false;
  }
}

function projectScript(name) {
  const path = join(projectRoot, '.trellis', 'scripts', name);
  if (!existsSync(path)) {
    fail(`not a Trellis project: missing .trellis/scripts/${name}`);
    return null;
  }
  return path;
}

function hasExecutable(name) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function parseSetupArgs(input, { requireName = false } = {}) {
  let name = null;
  let stack = null;
  const integrations = [];

  for (const arg of input) {
    if (arg === '--with-graphify') integrations.push('graphify');
    else if (arg === '--with-bounds') integrations.push('bounds');
    else if (arg.startsWith('--stack=')) {
      if (stack !== null) return { error: '--stack may only be provided once' };
      stack = arg.slice('--stack='.length);
    }
    else if (arg.startsWith('-')) return { error: `unknown option ${arg}` };
    else if (name === null) name = arg;
    else return { error: `unexpected operand ${arg}` };
  }

  if (requireName && !name) return { error: 'new requires a project name' };
  if (name && (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name === '.' || name === '..')) {
    return { error: 'project name must be one safe child-directory basename' };
  }
  if (stack !== null) {
    const values = stack.split(',').map((value) => value.trim());
    if (values.some((value) => !value || !STACKS.has(value))
      || (values.includes('generic') && new Set(values).size > 1)) {
      return { error: `unsupported stack ${stack}` };
    }
    stack = [...new Set(values)].join(',');
  }
  return { name, stack, integrations: [...new Set(integrations)] };
}

function copyScaffold(target) {
  for (const path of SCAFFOLD_PATHS) {
    const source = join(packageRoot, path);
    if (!existsSync(source)) continue;
    const destination = join(target, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true, preserveTimestamps: true });
  }
  for (const name of PORTABLE_TESTS) {
    const source = join(packageRoot, '.trellis', 'tests', name);
    const destination = join(target, '.trellis', 'tests', name);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination);
  }
  cpSync(
    join(packageRoot, '.trellis', 'scaffold', 'gitignore'),
    join(target, '.gitignore'),
  );
  mkdirSync(join(target, 'docs', 'systems'), { recursive: true });
  cpSync(
    join(packageRoot, '.trellis', 'scaffold', 'systems-readme.md'),
    join(target, 'docs', 'systems', 'README.md'),
  );
  mkdirSync(join(target, '.specify', 'specs'), { recursive: true });
  mkdirSync(join(target, 'docs', 'bug-fixes'), { recursive: true });
}

function runProjectScript(name, scriptArgs = []) {
  const script = projectScript(name);
  return script ? run(process.execPath, [script, ...scriptArgs]) : false;
}

switch (command) {
  case '--version':
  case 'version':
    if (args.length) usage('version accepts no operands');
    else console.log(packageJson.version);
    break;

  case 'help':
  case undefined:
    if (args.length) usage('help accepts no operands');
    else process.stdout.write(HELP);
    break;

  case 'new': {
    const parsed = parseSetupArgs(args, { requireName: true });
    if (parsed.error) {
      usage(parsed.error);
      break;
    }

    const target = join(projectRoot, parsed.name);
    if (existsSync(target)) {
      fail(`target already exists: ${target}`);
      break;
    }

    const temporary = mkdtempSync(join(projectRoot, `.${parsed.name}.trellis-`));
    try {
      copyScaffold(temporary);
      const initArgs = [join(temporary, '.trellis', 'init.sh'), parsed.name];
      if (parsed.stack) initArgs.push(`--stack=${parsed.stack}`);
      for (const integration of parsed.integrations) initArgs.push(`--with-${integration}`);
      execFileSync('bash', initArgs, {
        cwd: temporary,
        stdio: 'inherit',
        env: { ...process.env, ...(AI ? { TRELLIS_AI: '1' } : {}) },
      });
      renameSync(temporary, target);
      console.log(AI ? `OK: project=${target}` : `Created ${target}`);
    } catch {
      rmSync(temporary, { recursive: true, force: true });
      fail(`project creation failed; no target was published`);
    }
    break;
  }

  case 'init': {
    const init = join(projectRoot, '.trellis', 'init.sh');
    if (!existsSync(init)) {
      fail('not a Trellis checkout; see docs/adopting-existing-projects.md');
      break;
    }
    if (process.stdin.isTTY && args.length === 0) {
      run(process.execPath, [join(projectRoot, '.trellis', 'scripts', 'wizard.mjs')]);
      break;
    }
    const parsed = parseSetupArgs(args);
    if (parsed.error) {
      usage(parsed.error);
      break;
    }
    const initArgs = [init, parsed.name || basename(projectRoot)];
    if (parsed.stack) initArgs.push(`--stack=${parsed.stack}`);
    for (const integration of parsed.integrations) initArgs.push(`--with-${integration}`);
    run('bash', initArgs);
    break;
  }

  case 'check':
    if (args.length) usage('check accepts no operands');
    else run('npm', ['run', 'check']);
    break;

  case 'eval':
    if (args.length) usage('eval accepts no operands');
    else runProjectScript('run-evals.mjs');
    break;

  case 'map':
    if (args.length > 1 || (args[0] && args[0] !== '--json')) {
      usage('map accepts only --json');
    } else runProjectScript('repo-map.mjs', args);
    break;

  case 'config':
    if ((args[0] === 'show' && args.length === 1)
      || (['enable', 'disable'].includes(args[0]) && args.length === 2
        && ['graphify', 'bounds'].includes(args[1]))) {
      runProjectScript('config.mjs', args);
    } else {
      usage('config requires show or enable|disable graphify|bounds');
    }
    break;

  case 'metrics':
    if (args.some((arg) => !['--recent', '--raw'].includes(arg)) || args.length > 1) {
      usage('metrics accepts at most one of --recent or --raw');
    } else runProjectScript('metrics.mjs', args);
    break;

  case 'evolve': {
    if (args.length > 1 || (args[0] && !args[0].startsWith('--stack='))) {
      usage('evolve accepts only --stack=<value>');
      break;
    }
    const parsed = parseSetupArgs(args);
    if (parsed.error) usage(parsed.error);
    else runProjectScript('adapt-to-project.mjs', args);
    break;
  }

  case 'graph': {
    if (args.some((arg) => arg.startsWith('-')) || args.length > 1) {
      usage('graph accepts at most one project-relative path');
      break;
    }
    const path = args[0] || '.';
    const resolved = resolve(projectRoot, path);
    if (isAbsolute(path) || relative(projectRoot, resolved).startsWith('..')) {
      usage('graph path must stay inside the current project');
      break;
    }
    try {
      const config = validateConfig(JSON.parse(
        readFileSync(join(projectRoot, '.trellis', 'config.json'), 'utf8'),
      ));
      if (!config.enabled_integrations?.includes('graphify')) {
        fail('graphify is not enabled in .trellis/config.json');
        break;
      }
    } catch {
      fail('cannot read .trellis/config.json');
      break;
    }
    if (!hasExecutable('graphify')) {
      fail('graphify is enabled but not installed');
      break;
    }
    run('graphify', ['update', path]);
    break;
  }

  case 'services':
    if (args.length < 1 || args.length > 2 || !['start', 'stop', 'status', 'ports'].includes(args[0])
      || (args[1] && !['phoenix', 'all'].includes(args[1]))) {
      usage('services requires start|stop|status|ports and optional phoenix|all');
    } else runProjectScript('services.mjs', args);
    break;

  case 'spec':
    if (args.length) usage('spec accepts no operands');
    else console.log('Use the speckit-specify Agent Skill, then follow docs/sdd/sdd.md.');
    break;

  default:
    usage(`unknown command ${command}`);
}
