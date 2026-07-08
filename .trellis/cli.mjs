#!/usr/bin/env node
/**
 * trellis CLI
 *
 * Two output modes:
 *   - human (default on a TTY): friendly, with progress feedback
 *   - ai    (`--ai` or TRELLIS_AI=1): terse, structured, token-efficient —
 *           tells an agent exactly what each command does and what to run next
 *
 * Commands:
 *   trellis new <name> [--tier 1|2|3]  — scaffold a clean new project from this template
 *   trellis init                       — set up THIS repo (interactive on a TTY)
 *   trellis graph [path] [--update]    — build/refresh the Graphify knowledge graph
 *   trellis eval                       — run the eval suite
 *   trellis golden [freeze <NNN>|list|verify] — golden test management
 *   trellis metrics [--recent|--raw]   — token cost summary by agent/phase
 *   trellis check                      — lint + docs + evals (run before commit)
 *   trellis handoffs list|validate     — handoff registry ops
 *   trellis evolve [--all] [--stack=x] — re-adapt to the project stack
 *   trellis spec                       — advisory: how to start an SDD spec
 *   trellis help [--ai]                — this help
 *
 * Install: npm install -g . (after cloning)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateRoot = join(__dirname, '..');

// AI mode: explicit flag or env var. Strip --ai before parsing the command.
const AI = process.argv.includes('--ai') || process.env.TRELLIS_AI === '1';
const argv = process.argv.slice(2).filter((a) => a !== '--ai');
const [cmd, ...rest] = argv;
const sub = rest[0];

function run(command, opts = {}) {
  try {
    execSync(command, { cwd: templateRoot, stdio: 'inherit', ...opts });
  } catch {
    console.error(AI ? `FAIL: ${command}` : `Command failed: ${command}`);
    process.exit(1);
  }
}

function has(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Progress feedback so long commands don't look frozen.
function announce(msg) {
  if (AI) console.log(`RUN: ${msg}`);
  else console.log(`\n▶ ${msg}…`);
}

function ok(msg) {
  if (AI) console.log(`OK: ${msg}`);
  else console.log(`✓ ${msg}`);
}

const HUMAN_HELP = `Trellis CLI — AI-agent-ready project scaffold

Usage:
  trellis new <name> [--tier 1|2|3]   Scaffold a clean new project (default tier: 2)
  trellis init                        Set up THIS repo (interactive on a TTY)
  trellis graph [path] [--update]     Build/refresh the Graphify knowledge graph
  trellis eval                        Run the eval suite
  trellis golden [freeze|list|verify] Golden test management
  trellis metrics [--recent|--raw]    Token cost summary by agent/phase
  trellis check                       Lint + docs + evals (run before commit)
  trellis handoffs list|validate      List / validate the handoff registry
  trellis evolve [--all] [--stack=x]  Re-adapt to the project stack
  trellis spec                        How to start an SDD spec (advisory)
  trellis help [--ai]                 This help

AI agents: add --ai (or set TRELLIS_AI=1) for terse, machine-readable output.
`;

// Terse, directive, low-token. Every line: command -> effect -> next action.
const AI_HELP = `TRELLIS CLI [ai]. cwd-aware. exit!=0 = failure.
new <name> [--tier 1|2|3]   scaffold ./<name> (clean copy + init). tier2+ adds graphify+bounds.
init                        set up THIS repo. TTY=interactive wizard; non-TTY=defaults.
graph [path] [--update]     build/refresh graphify-out/graph.json. --update=incremental,no-LLM.
                            doc/paper extraction needs one of ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY; code-only needs none.
                            after build, query: graphify query "<q>" | graphify explain "<node>" | graphify path "A" "B"
eval                        run .trellis/scripts/run-evals.mjs.
golden [freeze <NNN>|list|verify]  manage golden test suites.
metrics [--recent|--raw]    summarize .trellis/metrics/runs.jsonl: cost by agent, phase, totals.
check                       npm lint + docs:check + evals. run before every commit.
handoffs list|validate      ops on .trellis/agents/handoffs/registry.yaml.
evolve [--all] [--stack=x]  re-adapt constitution+AGENTS.md to stack; --all also runs skill-health.
spec                        NOT runnable here. run /specify inside the AI assistant.
`;

function help() {
  process.stdout.write(AI ? AI_HELP : HUMAN_HELP);
}

switch (cmd) {
  case 'init':
    if (process.stdin.isTTY) {
      run('node .trellis/scripts/wizard.mjs');
    } else {
      announce('Setting up this repo (non-interactive defaults)');
      run('bash .trellis/init.sh "Trellis Project"');
    }
    break;

  case 'new': {
    const projectName = sub && !sub.startsWith('--') ? sub : 'my-project';
    let tierFlag = '2';
    const tEq = rest.find((a) => a.startsWith('--tier='));
    const tSpace = rest.indexOf('--tier');
    if (tEq) tierFlag = tEq.slice('--tier='.length);
    else if (tSpace !== -1) tierFlag = rest[tSpace + 1];
    if (!['1', '2', '3'].includes(tierFlag)) tierFlag = '2';

    const target = resolve(projectName);
    if (existsSync(target)) {
      console.error(AI ? `FAIL: directory exists: ${target}` : `Directory already exists: ${target}`);
      process.exit(1);
    }
    announce(`Creating new project: ${projectName} (Tier ${tierFlag})`);
    mkdirSync(target, { recursive: true });

    // Curated copy: users get a clean project, NOT the whole dev repo. Exclusions
    // match paths RELATIVE to templateRoot (so ".bounds/cache.db" excludes only
    // that file, and top-level ".next" only — a nested foo/.next is kept).
    // Dev-only files and generated mirror dirs (they regenerate via
    // `npm run skills:generate`) never ship to a new project.
    const exclude = new Set([
      '.git', 'node_modules', '.next', 'graphify-out', '.bounds/cache.db', 'WORKPLAN.md',
      '.gitattributes',
      '.claude/skills', '.codex/agents',
      '.opencode/command', '.github/agents',
      '.claude/commands', '.codex/prompts',
      '.trellis/metrics',
    ]);
    cpSync(templateRoot, target, {
      recursive: true,
      filter: (src) => {
        const rel = relative(templateRoot, src);
        return rel === '' || !exclude.has(rel);
      },
    });

    // Run init.sh in the new project. Tier drives which optional tools install.
    const flags = [`--tier=${tierFlag}`];
    if (tierFlag === '2' || tierFlag === '3') flags.push('--with-graphify', '--with-bounds');
    execSync(`bash .trellis/init.sh "${projectName}" ${flags.join(' ')}`, {
      cwd: target,
      stdio: 'inherit',
      env: { ...process.env, ...(AI ? { TRELLIS_AI: '1' } : {}) },
    });
    ok(AI ? `project at ${target}` : `Done! Project created at: ${target}`);
    break;
  }

  case 'spec':
    // Advisory only: the SDD flow is driven by the /specify slash command inside
    // your AI assistant. This CLI cannot launch that interactive flow itself.
    if (AI) {
      console.log('SPEC: not runnable from CLI. run `/specify <feature>` in the assistant. see docs/sdd/sdd.md.');
    } else {
      console.log('SDD is driven from your AI assistant, not this CLI.');
      console.log('Run  /specify <feature description>  in Claude Code / Codex / OpenCode / Copilot.');
      console.log('See docs/sdd/sdd.md for the full pipeline.');
    }
    break;

  case 'evolve': {
    // Re-adapt the framework to the current stack. `--all` also refreshes skill
    // health. `--stack=<x>` adapts to an explicit stack. Passes flags through.
    const all = rest.includes('--all');
    const evolveArgs = rest.filter((a) => a !== '--all');
    announce('Re-adapting to the project stack');
    run(`node .trellis/scripts/adapt-to-project.mjs ${evolveArgs.join(' ')}`.trim());
    if (all) {
      announce('Running skill-health checks');
      run('node .trellis/scripts/evolve-skills.mjs');
    }
    break;
  }

  case 'graph': {
    if (!has('graphify')) {
      console.error(AI
        ? 'MISSING: graphify. install: `uv tool install graphifyy==0.9.10` (or `pip install graphifyy`), then `graphify install --project`.'
        : "'graphify' not found. Install: uv tool install graphifyy (or pip install graphifyy), then: graphify install --project");
      process.exit(1);
    }
    const update = rest.includes('--update');
    const pathArg = rest.find((a) => !a.startsWith('--')) || '.';
    announce(update ? 'Updating knowledge graph (incremental, no LLM)' : 'Building knowledge graph');
    if (!AI) {
      console.log('  Note: doc/paper extraction needs an LLM key (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY).');
      console.log('        A code-only repo needs no key.');
    }
    run(update ? `graphify update ${pathArg}` : `graphify ${pathArg}`);
    ok('Graph at graphify-out/graph.json. Query: graphify query "how does X work?"');
    break;
  }

  case 'eval':
    announce('Running eval suite');
    run('node .trellis/scripts/run-evals.mjs');
    break;

  case 'golden':
    announce('Golden test operations');
    run(`node .trellis/scripts/golden-tests.mjs ${rest.join(' ') || 'list'}`);
    break;

  case 'metrics': {
    const mArg = rest[0] || '';
    announce('Reading metrics ledger');
    if (mArg === '--raw') {
      run('node .trellis/scripts/metrics.mjs --raw');
    } else if (mArg === '--recent') {
      run('node .trellis/scripts/metrics.mjs --recent');
    } else {
      run('node .trellis/scripts/metrics.mjs');
    }
    break;
  }

  case 'check':
    announce('Running all CI checks (lint + docs + evals)');
    run('npm run lint');
    run('npm run docs:check');
    run('node .trellis/scripts/run-evals.mjs');
    ok('All checks passed');
    break;

  case 'handoffs':
    if (sub === 'list' || !sub) {
      run('node .trellis/scripts/handoff-engine.mjs list');
    } else if (sub === 'validate') {
      run('node .trellis/scripts/handoff-engine.mjs validate');
    } else {
      console.error(AI ? 'USAGE: trellis handoffs list|validate' : 'Usage: trellis handoffs [list|validate]');
      process.exit(1);
    }
    break;

  case 'help':
  case undefined:
    help();
    break;

  default:
    console.error(AI ? `UNKNOWN: ${cmd}. run \`trellis help --ai\`.` : `Unknown command: ${cmd}\n`);
    help();
    process.exit(1);
}
