#!/usr/bin/env node
/**
 * check-skill-sync.mjs
 *
 * CI gate: verifies all platform skill mirrors match the source in
 * .trellis/agents/skills/.
 *
 * Usage: node .trellis/scripts/check-skill-sync.mjs
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const sourceDir = join(root, '.trellis', 'agents', 'skills');

if (!existsSync(sourceDir)) {
  console.log('SKIP: no .trellis/agents/skills/ directory');
  process.exit(0);
}

const skills = readdirSync(sourceDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (skills.length === 0) {
  console.log('SKIP: no skills found');
  process.exit(0);
}

let failures = 0;
const checks = [
  { platform: 'codex', path: (name) => join(root, '.codex', 'agents', name, 'SKILL.md') },
  { platform: 'opencode', path: (name) => join(root, '.opencode', 'command', `${name}.md`) },
  { platform: 'copilot', path: (name) => join(root, '.github', 'agents', `${name}.agent.md`) },
];

for (const skillName of skills) {
  const source = readFileSync(join(sourceDir, skillName, 'SKILL.md'), 'utf8');

  for (const { platform, path: getMirrorPath } of checks) {
    const mirrorPath = getMirrorPath(skillName);
    if (!existsSync(mirrorPath)) {
      console.error(`FAIL: ${platform} mirror missing for skill "${skillName}"`);
      failures++;
      continue;
    }
    const mirror = readFileSync(mirrorPath, 'utf8');
    if (mirror.trim() !== source.trim()) {
      console.error(`FAIL: ${platform} mirror out of sync for skill "${skillName}"`);
      console.error(`       Run: node .trellis/scripts/generate-skills.mjs`);
      failures++;
    }
  }
}

if (failures === 0) {
  console.log(`PASS: all ${skills.length} skill${skills.length !== 1 ? 's' : ''} in sync`);
  process.exit(0);
} else {
  process.exit(1);
}
