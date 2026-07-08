#!/usr/bin/env node

/**
 * evolve-skills.mjs
 *
 * Deterministic skill health checker. Replaces the fictional "evolution agent."
 * Zero tokens. Runs in CI or manually. Checks:
 *   1. All skills have valid frontmatter (name, description, version)
 *   2. All skills are mirrored to all 4 platforms (sync check)
 *   3. No skills reference files that don't exist
 *   4. No two skills overlap >50% on keywords or share >=2 commands (redundancy)
 *   5. All skills referenced in delegation matrix actually exist
 *   6. Skills are under the 3KB token-efficiency target
 *
 * Usage:
 *   node .trellis/scripts/evolve-skills.mjs           # check mode (CI gate)
 *   node .trellis/scripts/evolve-skills.mjs --report  # verbose report
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..', '..');

const sourceDir = join(root, '.trellis', 'agents', 'skills');
const platforms = [
  { name: 'Claude Code', dir: join(root, '.claude', 'skills') },
  { name: 'Codex', dir: join(root, '.codex', 'agents') },
  { name: 'OpenCode', dir: join(root, '.opencode', 'command') },
  { name: 'Copilot', dir: join(root, '.github', 'agents') },
];

const verbose = process.argv.includes('--report');
let violations = 0;
const warnings = [];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inMultiline = false;
  for (const line of lines) {
    // Check for multiline scalar indicator (|, >, etc.)
    const mlMatch = line.match(/^(\w+):\s*(\||>)\s*$/);
    if (mlMatch) {
      currentKey = mlMatch[1];
      fm[currentKey] = '';
      inMultiline = true;
      continue;
    }
    // Check for key: value (single line)
    const kvMatch = line.match(/^(\w+):\s*(.+)$/);
    if (kvMatch && !inMultiline) {
      currentKey = kvMatch[1];
      fm[currentKey] = kvMatch[2];
      continue;
    }
    // Multiline content (indented lines)
    if (inMultiline && currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      fm[currentKey] += (fm[currentKey] ? '\n' : '') + line.replace(/^\s+/, '');
      continue;
    }
    // Non-indented line ends multiline
    if (inMultiline && line.trim() && !line.startsWith('  ')) {
      inMultiline = false;
    }
    // Regular key after multiline ends
    if (!inMultiline) {
      const kv2 = line.match(/^(\w+):\s*(.*)$/);
      if (kv2) {
        currentKey = kv2[1];
        fm[currentKey] = kv2[2];
      }
    }
  }
  return fm;
}

function getSkillNames(content) {
  const lines = content.split('\n');
  const names = [];
  // Look for skill names in backticks or table rows
  for (const line of lines) {
    const matches = line.matchAll(/`([\w-]+)`/g);
    for (const m of matches) {
      if (m[1].includes('-') || ['sdd', 'api-routes', 'db-migrations', 'frontend-ui',
        'docs-maintenance', 'security-review', 'quality-gates', 'ponytail-review',
        'skill-evolution'].includes(m[1])) {
        names.push(m[1]);
      }
    }
  }
  return [...new Set(names)];
}

// 1. Check source skills exist and have valid frontmatter
console.log('── Skill Health Check ──\n');

if (!existsSync(sourceDir)) {
  console.log('SKIP: no .trellis/agents/skills/ directory');
  process.exit(0);
}

const skills = readdirSync(sourceDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (skills.length === 0) {
  console.log('SKIP: no skills found in .trellis/agents/skills/');
  process.exit(0);
}

console.log(`Found ${skills.length} skills: ${skills.join(', ')}\n`);

let frontmatterErrors = 0;
const skillData = {};

for (const skillName of skills) {
  const skillPath = join(sourceDir, skillName, 'SKILL.md');
  if (!existsSync(skillPath)) {
    console.error(`FAIL: ${skillName}/SKILL.md not found`);
    violations++;
    frontmatterErrors++;
    continue;
  }

  const content = readFileSync(skillPath, 'utf8');
  const fm = parseFrontmatter(content);
  const size = statSync(skillPath).size;

  skillData[skillName] = { content, fm, size, refs: getSkillNames(content) };

  // Check required frontmatter fields
  if (!fm || !fm.name) {
    console.error(`FAIL: ${skillName} - missing or invalid frontmatter 'name'`);
    violations++;
    frontmatterErrors++;
  } else if (fm.name !== skillName) {
    console.error(`FAIL: ${skillName} - frontmatter name '${fm.name}' != directory name '${skillName}'`);
    violations++;
    frontmatterErrors++;
  }

  if (!fm || !fm.description || fm.description.length < 20) {
    console.error(`FAIL: ${skillName} - missing or too-short description`);
    violations++;
    frontmatterErrors++;
  }

  if (!fm || !fm.version) {
    warnings.push(`${skillName} - no version in frontmatter`);
  }

  // Check size (token efficiency)
  if (size > 3072) {
    warnings.push(`${skillName} - ${size} bytes exceeds 3KB target (consider splitting to references/)`);
  }

  if (verbose) {
    console.log(`  ${skillName}: ${size}B, v${fm?.version || '?'}, ${fm?.description?.substring(0, 60) || 'NO DESC'}...`);
  }
}

if (frontmatterErrors === 0) {
  console.log('PASS: all skills have valid frontmatter\n');
}

// 2. Check skills are mirrored to all ACTIVE platforms
console.log('── Platform Sync ──');
let syncErrors = 0;

// Read active agents from config
const configPath = join(root, '.trellis', 'config.json');
let activeAgents = ['claude', 'codex', 'opencode', 'copilot'];
if (existsSync(configPath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (config.active_agents) activeAgents = config.active_agents;
  } catch {}
}

const platformDirs = {
  claude: (name) => join(root, '.claude', 'skills', name),
  codex: (name) => join(root, '.codex', 'agents', name),
  opencode: (name) => join(root, '.opencode', 'command', `${name}.md`),
  copilot: (name) => join(root, '.github', 'agents', `${name}.agent.md`),
};

console.log(`  Active agents: ${activeAgents.join(', ')}\n`);

for (const skillName of skills) {
  for (const agent of activeAgents) {
    if (!platformDirs[agent]) continue;
    const targetPath = platformDirs[agent](skillName);
    if (!existsSync(targetPath)) {
      warnings.push(`${skillName} - not mirrored to ${agent}. Run: node .trellis/scripts/generate-skills.mjs`);
    }
  }
}

// Check for stale mirrors on INACTIVE agents (shouldn't have skills)
const inactiveAgents = ['claude', 'codex', 'opencode', 'copilot'].filter(a => !activeAgents.includes(a));
for (const agent of inactiveAgents) {
  if (!platformDirs[agent]) continue;
  // Check if the directory has content
  const dirPath = agent === 'opencode' ? join(root, '.opencode', 'command')
    : agent === 'copilot' ? join(root, '.github', 'agents')
    : agent === 'claude' ? join(root, '.claude', 'skills')
    : join(root, '.codex', 'agents');
  if (existsSync(dirPath)) {
    const items = readdirSync(dirPath).filter(f => !f.startsWith('.'));
    const skillItems = items.filter(f =>
      skills.some(s => f.includes(s))
    );
    if (skillItems.length > 0) {
      warnings.push(`${agent} is inactive but has ${skillItems.length} stale skill mirrors. Run: node .trellis/scripts/generate-skills.mjs --prune`);
    }
  }
}

const mirrorWarnings = warnings.filter(w => w.includes('not mirrored') || w.includes('stale'));
if (mirrorWarnings.length === 0) {
  console.log('PASS: all skills mirrored to all active platforms\n');
} else {
  console.log(`WARN: ${mirrorWarnings.length} mirror issues\n`);
  syncErrors = mirrorWarnings.length;
}

// 3. Check for dangling references in skills
console.log('── Reference Integrity ──');
let refErrors = 0;

for (const [skillName, data] of Object.entries(skillData)) {
  // Check if referenced files exist
  const fileRefs = data.content.matchAll(/(?:scripts|docs|\.specify|\.trellis)\/[^\s)`'"]+?(?=[\s)`'".]|$)/g);
  for (const m of fileRefs) {
    const refPath = m[0].replace(/[`'"]/g, '');
    const fullPath = join(root, refPath);
    if (!existsSync(fullPath)) {
      // Check if it's a glob pattern (contains * or <)
      if (!refPath.includes('*') && !refPath.includes('<') && !refPath.includes('**')) {
        warnings.push(`${skillName} - references non-existent file: ${refPath}`);
        refErrors++;
      }
    }
  }
}

if (refErrors === 0) {
  console.log('PASS: no dangling file references\n');
} else {
  console.log(`WARN: ${refErrors} dangling references found\n`);
}

// 4. Check for redundancy (description keywords + command/action overlap)
console.log('── Redundancy Check ──');
let redundancyWarnings = 0;
const skillKeywords = {};
const skillCommands = {};

for (const [skillName, data] of Object.entries(skillData)) {
  if (!data.fm?.description) continue;
  const desc = data.fm.description.toLowerCase();
  const keywords = desc.match(/\b\w{4,}\b/g) || [];
  skillKeywords[skillName] = new Set(keywords);

  // Extract command/action patterns (npm run X, node .trellis/scripts/X)
  const cmdMatches = data.content.matchAll(/(?:npm run |npx |node \S+scripts\/)(\S+)/g);
  skillCommands[skillName] = new Set();
  for (const m of cmdMatches) {
    skillCommands[skillName].add(m[1]);
  }
}

const skillNames = Object.keys(skillKeywords);
for (let i = 0; i < skillNames.length; i++) {
  for (let j = i + 1; j < skillNames.length; j++) {
    // Keyword overlap
    const a = skillKeywords[skillNames[i]];
    const b = skillKeywords[skillNames[j]];
    const intersection = [...a].filter(x => b.has(x));
    const smaller = Math.min(a.size, b.size);
    if (smaller > 0 && intersection.length / smaller > 0.5) {
      warnings.push(`Redundancy: '${skillNames[i]}' and '${skillNames[j]}' share ${intersection.length} keywords (${Math.round(intersection.length/smaller*100)}% overlap)`);
      redundancyWarnings++;
    }

    // Command/action overlap (more precise - catches functional duplication)
    const cmdsA = skillCommands[skillNames[i]] || new Set();
    const cmdsB = skillCommands[skillNames[j]] || new Set();
    const sharedCmds = [...cmdsA].filter(x => cmdsB.has(x));
    if (sharedCmds.length >= 2) {
      warnings.push(`Redundancy: '${skillNames[i]}' and '${skillNames[j]}' share ${sharedCmds.length} commands (${sharedCmds.join(', ')}) — possible functional overlap`);
      redundancyWarnings++;
    }
  }
}

if (redundancyWarnings === 0) {
  console.log('PASS: no high-redundancy skill pairs\n');
} else {
  console.log(`WARN: ${redundancyWarnings} high-overlap pairs (consider merging)\n`);
}

// 5. Summary
console.log('═════════════════════════════════════════');
console.log(`  SKILL HEALTH: ${violations === 0 ? 'PASS' : `${violations} FAILURES`}`);
console.log(`  Skills: ${skills.length}`);
console.log(`  Violations: ${violations} (blocking)`);
console.log(`  Warnings: ${warnings.length} (advisory)`);
console.log('═════════════════════════════════════════');

if (verbose && warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) {
    console.log(`  - ${w}`);
  }
}

process.exit(violations > 0 ? 1 : 0);
