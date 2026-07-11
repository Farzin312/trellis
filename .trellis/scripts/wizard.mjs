#!/usr/bin/env node
/** Interactive, dependency-free argument collector for init.sh. */

import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const AGENTS = ['claude', 'codex', 'opencode', 'copilot'];
export const STACKS = {
  'auto-detect': '',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  generic: 'generic',
};

export function parseAgentSelection(value) {
  const tokens = value.split(',').map((token) => token.trim()).filter(Boolean);
  if (tokens.length === 0) throw new Error('Choose at least one agent');

  const agents = tokens.map((token) => {
    const agent = /^\d+$/.test(token) ? AGENTS[Number(token) - 1] : token;
    if (!agent || !AGENTS.includes(agent)) throw new Error(`Unknown agent: ${token}`);
    return agent;
  });
  return [...new Set(agents)];
}

export function buildInitArgs({ name, agents, stack, graphify, bounds }) {
  const args = ['.trellis/init.sh', name, `--agents=${agents.join(',')}`];
  if (stack) args.push(`--stack=${stack}`);
  if (graphify) args.push('--with-graphify');
  if (bounds) args.push('--with-bounds');
  return args;
}

async function main() {
  const rl = createInterface({ input, output });

  async function ask(question, fallback = '') {
    const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim();
    return answer || fallback;
  }

  async function askYesNo(question, fallback) {
    for (;;) {
      const answer = (await ask(question, fallback ? 'Y/n' : 'y/N')).toLowerCase();
      if (['y', 'yes', 'y/n'].includes(answer)) return true;
      if (['n', 'no'].includes(answer)) return false;
      console.log('  Enter yes or no.');
    }
  }

  async function askChoice(question, choices, fallback) {
    console.log(`\n${question}`);
    choices.forEach((choice, index) => console.log(`  ${index + 1}) ${choice}`));
    for (;;) {
      const answer = await ask('Choose', String(choices.indexOf(fallback) + 1));
      const index = Number(answer) - 1;
      if (Number.isInteger(index) && choices[index]) return choices[index];
      console.log(`  Choose a number from 1 to ${choices.length}.`);
    }
  }

  console.log('\n  Trellis — project setup\n  -----------------------');
  const name = await ask('\nProject name', 'my-app');

  console.log('\nWhich AI agents? (comma-separated)');
  AGENTS.forEach((agent, index) => console.log(`  ${index + 1}) ${agent}`));
  let agents;
  while (!agents) {
    try {
      agents = parseAgentSelection(await ask('Agents', AGENTS.join(',')));
    } catch (error) {
      console.log(`  ${error.message}`);
    }
  }

  const stackLabel = await askChoice('Stack?', Object.keys(STACKS), 'auto-detect');
  const stack = STACKS[stackLabel];
  const graphify = await askYesNo('Install Graphify (knowledge graph)?', false);
  const bounds = await askYesNo('Install Bounds (boundary enforcement)?', false);

  console.log('\n  Plan');
  console.log('  ----');
  console.log(`  Project name : ${name}`);
  console.log(`  Agents       : ${agents.join(', ')}`);
  console.log(`  Stack        : ${stackLabel}`);
  console.log(`  Graphify     : ${graphify ? 'yes' : 'no'}`);
  console.log(`  Bounds       : ${bounds ? 'yes' : 'no'}`);
  console.log('');

  if (!(await askYesNo('Proceed?', true))) {
    console.log('Aborted. Nothing was changed.');
    rl.close();
    return;
  }
  rl.close();

  const result = spawnSync('bash', buildInitArgs({ name, agents, stack, graphify, bounds }), {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, TRELLIS_WIZARD: '1' },
  });
  if (result.error) {
    console.error(`FAIL: could not start init.sh: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  });
}
