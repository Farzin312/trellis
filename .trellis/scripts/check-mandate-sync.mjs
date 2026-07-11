#!/usr/bin/env node
/** Validate Claude's native import of the canonical cross-agent mandate. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const agentsFile = join(root, 'AGENTS.md');
const claudeFile = join(root, 'CLAUDE.md');

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--fix') || args.filter((arg) => arg === '--fix').length > 1) {
  console.error('Usage: check-mandate-sync.mjs [--fix]');
  process.exit(2);
}
const fix = args[0] === '--fix';

if (!existsSync(agentsFile)) {
  console.error('FAIL: AGENTS.md not found');
  process.exit(1);
}

if (fix) {
  writeFileSync(claudeFile, '@AGENTS.md\n');
  console.log('FIXED: CLAUDE.md imports AGENTS.md');
  process.exit(0);
}

// Check mode
if (!existsSync(claudeFile)) {
  console.error('FAIL: CLAUDE.md not found. Run: npm run check:mandates -- --fix');
  process.exit(1);
}

if (readFileSync(claudeFile, 'utf8').trim() === '@AGENTS.md') {
  console.log('PASS: CLAUDE.md imports AGENTS.md');
  process.exit(0);
} else {
  console.error('FAIL: CLAUDE.md must contain only @AGENTS.md');
  console.error('       Run: npm run check:mandates -- --fix');
  process.exit(1);
}
