#!/usr/bin/env node
/**
 * check-mandate-sync.mjs
 *
 * CI gate + fixer: verifies AGENTS.md and CLAUDE.md are byte-identical
 * (after stripping the auto-generated header from CLAUDE.md).
 *
 * Usage:
 *   node scripts/check-mandate-sync.mjs           # check mode (CI)
 *   node scripts/check-mandate-sync.mjs --fix     # fix mode: copy AGENTS.md -> CLAUDE.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const agentsFile = join(root, 'AGENTS.md');
const claudeFile = join(root, 'CLAUDE.md');

const args = process.argv.slice(2);
const fix = args.includes('--fix');

if (!existsSync(agentsFile)) {
  console.error('FAIL: AGENTS.md not found');
  process.exit(1);
}

const agentsContent = readFileSync(agentsFile, 'utf8');

if (fix) {
  const header = `<!-- Auto-generated mandate sync copy.\n     Do not edit directly — edit AGENTS.md, then run: npm run check:mandates -- --fix\n     CI gate: npm run check:mandates verifies this file matches AGENTS.md. -->\n`;
  writeFileSync(claudeFile, header + agentsContent);
  console.log('FIXED: CLAUDE.md synced to AGENTS.md');
  process.exit(0);
}

// Check mode
if (!existsSync(claudeFile)) {
  console.error('FAIL: CLAUDE.md not found. Run with --fix to generate.');
  process.exit(1);
}

const claudeContent = readFileSync(claudeFile, 'utf8');
// Strip the auto-generated header from CLAUDE.md for comparison
const claudeBody = claudeContent.replace(/^<!--[\s\S]*?-->\n*/, '');

if (claudeBody.trim() === agentsContent.trim()) {
  console.log('PASS: AGENTS.md and CLAUDE.md are in sync');
  process.exit(0);
} else {
  console.error('FAIL: AGENTS.md and CLAUDE.md are out of sync');
  console.error('       Run: npm run check:mandates -- --fix');
  process.exit(1);
}
