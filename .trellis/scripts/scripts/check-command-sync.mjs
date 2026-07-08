#!/usr/bin/env node
/**
 * check-command-sync.mjs
 *
 * CI gate: verifies all platform command mirrors match their source.
 *
 * Usage: node scripts/check-command-sync.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceDir = join(root, '.specify', 'templates', 'commands');

const checks = [
  { platform: 'claude', dir: join(root, '.claude', 'commands'), suffix: '' },
  { platform: 'codex', dir: join(root, '.codex', 'prompts'), suffix: '' },
  { platform: 'opencode', dir: join(root, '.opencode', 'command'), suffix: '' },
  { platform: 'copilot', dir: join(root, '.github', 'agents'), suffix: '.agent' },
];

if (!existsSync(sourceDir)) {
  console.log('SKIP: no command sources found');
  process.exit(0);
}

const commands = readdirSync(sourceDir).filter(f => f.endsWith('.md'));
let failures = 0;

for (const cmd of commands) {
  const phase = cmd.replace('.md', '');
  const source = readFileSync(join(sourceDir, cmd), 'utf8');

  for (const { platform, dir, suffix } of checks) {
    const mirrorFile = join(dir, `speckit.${phase}${suffix}.md`);
    if (!existsSync(mirrorFile)) {
      console.error(`FAIL: ${platform} mirror missing for ${phase}`);
      failures++;
      continue;
    }
    const mirror = readFileSync(mirrorFile, 'utf8');
    if (mirror.trim() !== source.trim()) {
      console.error(`FAIL: ${platform} mirror out of sync for ${phase}`);
      console.error(`       Run: node scripts/generate-commands.mjs`);
      failures++;
    }
  }
}

if (failures === 0) {
  console.log(`PASS: all ${commands.length} commands in sync across 4 platforms`);
  process.exit(0);
} else {
  process.exit(1);
}
