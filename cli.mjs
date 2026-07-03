#!/usr/bin/env node
/**
 * trellis CLI
 *
 * Usage:
 *   trellis init                    — run init.sh with defaults
 *   trellis new <name> [--tier N]   — scaffold a new project from this template
 *   trellis spec                    — start a new SDD spec (interactive)
 *   trellis graph                   — rebuild the Graphify knowledge graph
 *   trellis eval                    — run the full eval suite
 *   trellis check                   — run all CI checks locally
 *   trellis handoffs list           — list configured handoff specialists
 *   trellis handoffs validate       — validate the handoff registry
 *
 * Install: pipx install git+https://github.com/farzin/trellis.git
 * Or:      npm install -g . (after cloning)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templateRoot = join(__dirname, '..');

const [cmd, ...rest] = process.argv.slice(2);
const sub = rest[0];

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { cwd: templateRoot, stdio: 'inherit', ...opts });
  } catch {
    console.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
}

switch (cmd) {
  case 'init':
    console.log('Running init.sh...');
    run('bash init.sh "Trellis Project"');
    break;

  case 'new': {
    const projectName = sub || 'my-project';
    const tierFlag = process.argv.includes('--tier') ? process.argv[process.argv.indexOf('--tier') + 1] : '2';
    const target = resolve(projectName);
    if (existsSync(target)) {
      console.error(`Directory already exists: ${target}`);
      process.exit(1);
    }
    console.log(`Creating new project: ${projectName} (Tier ${tierFlag})`);
    mkdirSync(target, { recursive: true });

    // Copy the template (excluding .git, node_modules)
    const exclude = new Set(['.git', 'node_modules', '.next', 'graphify-out', '.bounds/cache.db']);
    cpSync(templateRoot, target, {
      recursive: true,
      filter: (src) => {
        const name = src.split('/').pop();
        return !exclude.has(name);
      },
    });

    // Run init.sh in the new project
    const flags = [];
    if (tierFlag === '2' || tierFlag === '3') flags.push('--with-graphify', '--with-bounds');
    console.log(`Running init.sh in ${target}...`);
    execSync(`bash init.sh "${projectName}" ${flags.join(' ')}`, { cwd: target, stdio: 'inherit' });
    console.log(`\nDone! Project created at: ${target}`);
    break;
  }

  case 'spec':
    console.log('Starting new SDD spec...');
    console.log('Run /specify <feature description> in your AI assistant.');
    console.log('Or use: node scripts/generate-commands.mjs to ensure commands are synced.');
    break;

  case 'graph':
    if (!existsSync(join(templateRoot, 'graphify-out'))) {
      console.log('Building knowledge graph...');
    }
    run('graphify .');
    break;

  case 'eval':
    run('node scripts/run-evals.mjs');
    break;

  case 'check':
    console.log('Running all CI checks...');
    run('npm run lint');
    run('npm run docs:check');
    run('node scripts/run-evals.mjs');
    break;

  case 'handoffs':
    if (sub === 'list' || !sub) {
      run('node scripts/handoff-engine.mjs list');
    } else if (sub === 'validate') {
      run('node scripts/handoff-engine.mjs validate');
    } else {
      console.error('Usage: trellis handoffs [list|validate]');
      process.exit(1);
    }
    break;

  default:
    console.log(`Trellis CLI — AI-agent-ready project scaffold

Usage:
  trellis init                    Run init.sh with defaults
  trellis new <name> [--tier N]   Scaffold a new project (default tier: 2)
  trellis spec                    Start a new SDD spec
  trellis graph                   Rebuild the Graphify knowledge graph
  trellis eval                    Run the full eval suite
  trellis check                   Run all CI checks locally
  trellis handoffs list           List configured handoff specialists
  trellis handoffs validate       Validate the handoff registry
`);
    break;
}
