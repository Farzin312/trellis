#!/usr/bin/env node
/** Interactive, dependency-free argument collector for init.sh. */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { readProjectConfig } from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const STACKS = {
  'auto-detect': '',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  generic: 'generic',
};

export function buildInitArgs({ name, stack, graphify, bounds }) {
  const args = ['.trellis/init.sh', name];
  if (stack) args.push(`--stack=${stack}`);
  if (graphify) args.push('--with-graphify');
  if (bounds) args.push('--with-bounds');
  return args;
}

export function parseYesNo(answer, fallback) {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['y', 'yes'].includes(normalized)) return true;
  if (['n', 'no'].includes(normalized)) return false;
  return null;
}

async function main() {
  const rl = createInterface({ input, output });

  async function ask(question, fallback = '') {
    const answer = (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim();
    return answer || fallback;
  }

  async function askYesNo(question, fallback) {
    for (;;) {
      const answer = await rl.question(`${question} [${fallback ? 'Y/n' : 'y/N'}]: `);
      const parsed = parseYesNo(answer, fallback);
      if (parsed !== null) return parsed;
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
  const existing = existsSync(join(root, '.trellis', 'config.json'))
    ? readProjectConfig(root)
    : null;
  const name = existing?.project_name || await ask('\nProject name', basename(root));
  if (existing) console.log(`\n  Existing project identity: ${name}`);

  let stackLabel;
  let stack;
  let graphify;
  let bounds;
  if (existing) {
    stackLabel = `keep configured (${existing.stacks.join(', ')})`;
    stack = '';
    graphify = existing.enabled_integrations.includes('graphify');
    bounds = existing.enabled_integrations.includes('bounds');
    console.log('\n  Existing stack and integration gates will keep configured values.');
    console.log('  Use trellis config enable|disable <graphify|bounds> to change a gate.');
  } else {
    stackLabel = await askChoice('Stack?', Object.keys(STACKS), 'auto-detect');
    stack = STACKS[stackLabel];
    graphify = await askYesNo('Enable Graphify as a project-wide requirement (installation is separate)?', false);
    bounds = await askYesNo('Enable Bounds as a project-wide requirement (installation is separate)?', false);
  }

  console.log('\n  Plan');
  console.log('  ----');
  console.log(`  Project name : ${name}`);
  console.log(`  Stack        : ${stackLabel}`);
  console.log(`  Graphify gate: ${graphify ? 'enabled' : 'disabled'}`);
  console.log(`  Bounds gate  : ${bounds ? 'enabled' : 'disabled'}`);
  console.log('');

  if (!(await askYesNo('Proceed?', true))) {
    console.log('Aborted. Nothing was changed.');
    rl.close();
    return;
  }
  rl.close();

  const result = spawnSync('bash', buildInitArgs({ name, stack, graphify, bounds }), {
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
