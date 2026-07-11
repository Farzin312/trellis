#!/usr/bin/env node
/** Validate Claude's native import of the canonical cross-agent mandate. */

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
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

function writeClaude(content) {
  const temporary = `${claudeFile}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporary, content);
  renameSync(temporary, claudeFile);
}

if (!existsSync(agentsFile)) {
  console.error('FAIL: AGENTS.md not found');
  process.exit(1);
}

if (fix) {
  if (!existsSync(claudeFile)) {
    writeClaude('@AGENTS.md\n');
    console.log('FIXED: created CLAUDE.md with AGENTS.md import');
    process.exit(0);
  }
  const current = readFileSync(claudeFile, 'utf8');
  if (current.split(/\r?\n/, 1)[0] === '@AGENTS.md') {
    console.log('KEEP: CLAUDE.md already imports AGENTS.md first');
    process.exit(0);
  }
  const body = current
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '@AGENTS.md')
    .join('\n')
    .replace(/^\n+/, '');
  writeClaude(`@AGENTS.md\n${body ? `\n${body}` : ''}`);
  console.log('FIXED: prepended AGENTS.md import and preserved Claude-specific instructions');
  process.exit(0);
}

// Check mode
if (!existsSync(claudeFile)) {
  console.error('FAIL: CLAUDE.md not found. Run: npm run check:mandates -- --fix');
  process.exit(1);
}

if (readFileSync(claudeFile, 'utf8').split(/\r?\n/, 1)[0] === '@AGENTS.md') {
  console.log('PASS: CLAUDE.md imports AGENTS.md first');
  process.exit(0);
} else {
  console.error('FAIL: CLAUDE.md must import @AGENTS.md on its first line');
  console.error('       Run: npm run check:mandates -- --fix');
  process.exit(1);
}
