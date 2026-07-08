#!/usr/bin/env node
/**
 * generate-commands.mjs
 *
 * Reads command SOURCE files from .specify/templates/commands/*.md
 * and generates platform-specific mirrors to:
 *   .claude/commands/speckit.*.md      (Claude Code)
 *   .codex/prompts/speckit.*.md        (Codex CLI)
 *   .opencode/command/speckit.*.md     (OpenCode)
 *   .github/agents/speckit.*.agent.md  (GitHub Copilot)
 *
 * The source files are the single source of truth. This script ensures
 * all 4 platforms receive identical command content.
 *
 * Usage: node .trellis/scripts/generate-commands.mjs
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const sourceDir = join(root, '.specify', 'templates', 'commands');

const targets = {
  claude: join(root, '.claude', 'commands'),
  codex: join(root, '.codex', 'prompts'),
  opencode: join(root, '.opencode', 'command'),
  copilot: join(root, '.github', 'agents'),
};

// Ensure target directories exist
for (const dir of Object.values(targets)) {
  mkdirSync(dir, { recursive: true });
}

if (!existsSync(sourceDir)) {
  console.error('FAIL: command source directory not found:', sourceDir);
  process.exit(1);
}

const commands = readdirSync(sourceDir).filter(f => f.endsWith('.md'));
let count = 0;

for (const cmd of commands) {
  const phase = cmd.replace('.md', '');
  const content = readFileSync(join(sourceDir, cmd), 'utf8');

  // Claude Code: speckit.<phase>.md
  writeFileSync(join(targets.claude, `speckit.${phase}.md`), content);

  // Codex: speckit.<phase>.md
  writeFileSync(join(targets.codex, `speckit.${phase}.md`), content);

  // OpenCode: speckit.<phase>.md
  writeFileSync(join(targets.opencode, `speckit.${phase}.md`), content);

  // Copilot: speckit.<phase>.agent.md
  writeFileSync(join(targets.copilot, `speckit.${phase}.agent.md`), content);

  count++;
}

console.log(`PASS: Generated ${count} commands x 4 platforms = ${count * 4} files`);
