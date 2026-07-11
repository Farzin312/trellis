#!/usr/bin/env node
/** Reject stack-specific defaults from canonical durable guidance. */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--report')) {
  console.error('Usage: check-agnostic.mjs [--report]');
  process.exit(2);
}

const files = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/STRUCTURE.md',
  'docs/coding-standards.md',
  'docs/sdd/sdd.md',
  'docs/README-FOR-AGENTS.md',
  '.specify/memory/constitution.md',
];
const rules = [
  { label: 'Supabase', pattern: /\bSupabase\b/i },
  { label: 'PostgREST', pattern: /\bPostgREST\b/i },
  { label: 'Stripe', pattern: /\bStripe\b/i },
  { label: 'Next.js', pattern: /\bNext\.js\b/i },
  { label: 'React Server Components', pattern: /\bReact Server Components?\b/i },
];

let failures = 0;
for (const relativePath of files) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    console.error(`FAIL: missing canonical guidance: ${relativePath}`);
    failures++;
    continue;
  }
  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (!rule.pattern.test(line)) continue;
      console.error(`FAIL: ${relativePath}:${index + 1} stack-specific default: ${rule.label}`);
      failures++;
    }
  });
  if (args[0] === '--report') console.log(`CHECKED: ${relativePath}`);
}

if (failures > 0) {
  console.error(`FAIL: ${failures} durable-guidance issue(s)`);
  process.exit(1);
}
console.log(`PASS: ${files.length} canonical guidance files are stack-agnostic`);
