#!/usr/bin/env node
/**
 * generate-skills.mjs
 *
 * Reads SKILL.md sources from .agents/skills/ and mirrors them to all 4
 * AI agent platform directories:
 *   .claude/skills/<name>/      (symlink — Claude Code supports symlinks)
 *   .codex/agents/<name>/       (copy)
 *   .opencode/command/<name>.md (copy, flat file)
 *   .github/agents/<name>.agent.md (copy)
 *
 * Usage: node scripts/generate-skills.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, symlinkSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceDir = join(root, '.agents', 'skills');

const targets = {
  claude: join(root, '.claude', 'skills'),
  codex: join(root, '.codex', 'agents'),
  opencode: join(root, '.opencode', 'command'),
  copilot: join(root, '.github', 'agents'),
};

for (const dir of Object.values(targets)) {
  mkdirSync(dir, { recursive: true });
}

if (!existsSync(sourceDir)) {
  console.log('SKIP: no .agents/skills/ directory');
  process.exit(0);
}

const skills = readdirSync(sourceDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (skills.length === 0) {
  console.log('SKIP: no skills found in .agents/skills/');
  process.exit(0);
}

let count = 0;
for (const skillName of skills) {
  const skillSourcePath = join(sourceDir, skillName);
  const skillFile = join(skillSourcePath, 'SKILL.md');

  if (!existsSync(skillFile)) {
    console.warn(`WARN: ${skillName}/SKILL.md not found, skipping`);
    continue;
  }

  const content = readFileSync(skillFile, 'utf8');

  // Claude Code: symlink the directory (preferred — live updates)
  const claudeTarget = join(targets.claude, skillName);
  try { rmSync(claudeTarget, { recursive: true, force: true }); } catch {}
  try {
    symlinkSync(skillSourcePath, claudeTarget);
  } catch {
    // Fallback: copy if symlink fails (Windows, permissions)
    mkdirSync(claudeTarget, { recursive: true });
    writeFileSync(join(claudeTarget, 'SKILL.md'), content);
  }

  // Codex: copy directory
  const codexTargetDir = join(targets.codex, skillName);
  mkdirSync(codexTargetDir, { recursive: true });
  writeFileSync(join(codexTargetDir, 'SKILL.md'), content);

  // OpenCode: flat markdown file
  writeFileSync(join(targets.opencode, `${skillName}.md`), content);

  // Copilot: agent markdown file
  writeFileSync(join(targets.copilot, `${skillName}.agent.md`), content);

  count++;
}

console.log(`PASS: Generated ${count} skill${count !== 1 ? 's' : ''} x 4 platforms`);
