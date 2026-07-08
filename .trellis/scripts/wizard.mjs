#!/usr/bin/env node
/**
 * wizard.mjs — interactive install flow (create-next-app style).
 *
 * Runs when `trellis init` or `bash init.sh` is invoked with no args on a TTY.
 * Every answer maps to an existing init.sh flag; the wizard just collects them,
 * prints a plan, confirms, then shells to init.sh. No new dependencies —
 * node:readline/promises only.
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rl = createInterface({ input, output });

const AGENTS = ['claude', 'codex', 'opencode', 'copilot'];
// Menu label -> adapt-to-project --stack value ('' = auto-detect from manifests).
const STACKS = {
  'auto-detect': '',
  'next+supabase': 'nextjs,supabase',
  python: '',
  go: '',
  rust: '',
  generic: '',
};

async function ask(question, def) {
  const a = (await rl.question(`${question}${def ? ` [${def}]` : ''}: `)).trim();
  return a || def || '';
}

async function askYesNo(question, def) {
  const a = (await ask(question, def ? 'Y/n' : 'y/N')).toLowerCase();
  if (!a) return def;
  return a.startsWith('y');
}

async function askChoice(question, choices, def) {
  console.log(`\n${question}`);
  choices.forEach((c, i) => console.log(`  ${i + 1}) ${c}`));
  const a = await ask('Choose', String(choices.indexOf(def) + 1));
  const idx = Number(a) - 1;
  return choices[idx] ?? def;
}

async function main() {
  console.log('\n  Trellis — new project setup\n  ---------------------------');

  const name = await ask('\nProject name', 'my-app');

  // Multi-select agents: comma-separated numbers or names, default all.
  console.log('\nWhich AI agents? (comma-separated, default all)');
  AGENTS.forEach((a, i) => console.log(`  ${i + 1}) ${a}`));
  const rawAgents = await ask('Agents', AGENTS.join(','));
  const agents = rawAgents
    .split(',')
    .map((t) => t.trim())
    .map((t) => (/^\d+$/.test(t) ? AGENTS[Number(t) - 1] : t))
    .filter((t) => AGENTS.includes(t));
  const agentList = agents.length ? [...new Set(agents)] : AGENTS;

  const tier = await askChoice(
    'Tier?',
    ['1 (Core)', '2 (Intelligence)', '3 (Full)'],
    '2 (Intelligence)',
  );
  const tierNum = tier[0]; // '1' | '2' | '3'

  // Tier drives the defaults; the user still confirms each tool.
  const tierWantsTools = tierNum !== '1';
  const withGraphify = tierWantsTools
    ? await askYesNo('Install Graphify (knowledge graph)?', true)
    : false;
  const withBounds = tierWantsTools
    ? await askYesNo('Install Bounds (boundary enforcement)?', true)
    : false;

  const stackLabel = await askChoice('Stack?', Object.keys(STACKS), 'auto-detect');
  const stackValue = STACKS[stackLabel];

  // ── Plan + confirm ──────────────────────────────────────────────────
  console.log('\n  Plan');
  console.log('  ----');
  console.log(`  Project name : ${name}`);
  console.log(`  Agents       : ${agentList.join(', ')}`);
  console.log(`  Tier         : ${tierNum}`);
  console.log(`  Graphify     : ${withGraphify ? 'yes' : 'no'}`);
  console.log(`  Bounds       : ${withBounds ? 'yes' : 'no'}`);
  console.log(`  Stack        : ${stackLabel}${stackValue ? ` (${stackValue})` : ''}`);
  console.log('');

  if (!(await askYesNo('Proceed?', true))) {
    console.log('Aborted. Nothing was changed.');
    rl.close();
    process.exit(0);
  }
  rl.close();

  // ── Compose init.sh invocation ──────────────────────────────────────
  const args = [
    '.trellis/init.sh',
    name,
    `--tier=${tierNum}`,
    `--agents=${agentList.join(',')}`,
  ];
  if (withGraphify) args.push('--with-graphify');
  if (withBounds) args.push('--with-bounds');
  if (stackValue) args.push(`--stack=${stackValue}`);

  const res = spawnSync('bash', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, TRELLIS_WIZARD: '1' },
  });
  process.exit(res.status ?? 0);
}

main();
