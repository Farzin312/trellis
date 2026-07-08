#!/usr/bin/env node
/**
 * generate-skills.mjs
 *
 * Reads SKILL.md sources from .agents/skills/ and mirrors them to the
 * agent platform directories listed in .trellis/config.json.
 *
 * Default targets (when config.json lists all 4):
 *   .claude/skills/<name>/          (symlink — Claude Code supports symlinks)
 *   .codex/agents/<name>/           (copy)
 *   .opencode/command/<name>.md     (copy, flat file)
 *   .github/agents/<name>.agent.md  (copy)
 *
 * If a user only uses Claude Code + Copilot, set active_agents in
 * .trellis/config.json to ["claude", "copilot"] and only those
 * directories receive skills.
 *
 * Usage:
 *   node scripts/generate-skills.mjs              # mirror to active agents
 *   node scripts/generate-skills.mjs --all        # mirror to ALL agents (override)
 *   node scripts/generate-skills.mjs --prune      # remove stale mirrors too
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, symlinkSync, unlinkSync, rmSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceDir = join(root, '.agents', 'skills');
const configPath = join(root, '.trellis', 'config.json');

// --- Determine active agents ---
const allTargets = {
  claude:   { dir: join(root, '.claude', 'skills'),   format: 'dir',     suffix: '' },
  codex:    { dir: join(root, '.codex', 'agents'),    format: 'dir',     suffix: '' },
  opencode: { dir: join(root, '.opencode', 'command'), format: 'flat',    suffix: '.md' },
  copilot:  { dir: join(root, '.github', 'agents'),    format: 'flat',    suffix: '.agent.md' },
};

const forceAll = process.argv.includes('--all');
const prune = process.argv.includes('--prune');

let activeAgents = ['claude', 'codex', 'opencode', 'copilot'];

if (existsSync(configPath) && !forceAll) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (config.active_agents && Array.isArray(config.active_agents) && config.active_agents.length > 0) {
      activeAgents = config.active_agents;
    }
  } catch {
    // Config invalid, use defaults
  }
}

// Filter targets to active agents only
const targets = {};
for (const agent of activeAgents) {
  if (allTargets[agent]) {
    targets[agent] = allTargets[agent];
    mkdirSync(targets[agent].dir, { recursive: true });
  }
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

  for (const [agentName, target] of Object.entries(targets)) {
    if (target.format === 'dir') {
      if (agentName === 'claude') {
        // Claude Code: symlink the directory (preferred — live updates)
        const claudeTarget = join(target.dir, skillName);
        try { rmSync(claudeTarget, { recursive: true, force: true }); } catch {}
        try {
          symlinkSync(skillSourcePath, claudeTarget);
        } catch {
          // Fallback: copy if symlink fails (Windows, permissions)
          mkdirSync(claudeTarget, { recursive: true });
          writeFileSync(join(claudeTarget, 'SKILL.md'), content);
        }
      } else {
        // Codex and other dir-based: copy directory
        const dirTarget = join(target.dir, skillName);
        mkdirSync(dirTarget, { recursive: true });
        writeFileSync(join(dirTarget, 'SKILL.md'), content);
      }
    } else {
      // Flat format (OpenCode, Copilot): single file
      const flatTarget = join(target.dir, `${skillName}${target.suffix}`);
      writeFileSync(flatTarget, content);
    }
  }

  count++;
}

// Prune stale mirrors (skills that no longer exist in source)
if (prune) {
  for (const [agentName, target] of Object.entries(targets)) {
    const existing = readdirSync(target.dir).filter(f => !f.startsWith('.'));
    for (const item of existing) {
      // Extract skill name from directory or filename
      let skillName = item;
      if (target.suffix && item.endsWith(target.suffix)) {
        skillName = item.slice(0, -target.suffix.length);
      }
      if (!skills.includes(skillName)) {
        const stalePath = join(target.dir, item);
        try { rmSync(stalePath, { recursive: true, force: true }); } catch {}
        console.log(`PRUNE: removed stale ${agentName} mirror: ${item}`);
      }
    }
  }
}

const platformList = Object.keys(targets).join(', ');
console.log(`PASS: Generated ${count} skill${count !== 1 ? 's' : ''} x ${Object.keys(targets).length} platform${Object.keys(targets).length !== 1 ? 's' : ''} (${platformList})`);
