#!/usr/bin/env node
/**
 * check-agnostic.mjs
 *
 * Stack-agnostic enforcement. Scans framework-core files for stack-specific
 * identifiers that appear as REQUIREMENTS or DEFAULTS — not as examples.
 *
 * Key distinction (the whole point):
 *   "Trellis works with Supabase"     → OK (mentioning as supported)
 *   "Auth truth is Supabase Auth"     → FAIL (hardcoding as requirement)
 *   "e.g., React, Vue, Svelte"        → OK (example list)
 *   "All pages are React Server..."   → FAIL (mandating a specific framework)
 *
 * Detection heuristics:
 *   1. Skip lines inside ``` code fences
 *   2. Skip lines that contain example markers: "e.g.", "example", "such as",
 *      "including", "or no", "supported", "works with", "does NOT assume"
 *   3. Skip lines that contain 2+ stack names (lists/comparisons are examples)
 *   4. Flag lines where ONE stack name appears in a mandate context
 *      (followed by "MUST", "is", "uses", "default", "truth")
 *
 * Usage:
 *   node scripts/check-agnostic.mjs           # check mode (CI gate)
 *   node scripts/check-agnostic.mjs --report  # verbose report
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Stack-specific identifiers
const STACK_IDENTIFIERS = [
  'supabase', 'postgres', 'mysql', 'mongodb', 'planetscale', 'turso', 'sqlite',
  'react', 'nextjs', 'next.js', 'svelte', 'sveltekit', 'nuxt', 'vue', 'solid',
  'remix', 'astro', 'angular',
  'express', 'fastify', 'nestjs', 'deno', 'bun',
  'stripe', 'square', 'paypal', 'lemon squeezy', 'shippo',
  'vercel', 'netlify', 'cloudflare',
];

// Words that contain stack names but are NOT references
const FALSE_POSITIVES = [
  'expression', 'bundle', 'bundles', 'reactive', 'reactivity',
  'currently', 'expressed', 'expressing',
];

// Contexts where stack mentions are EXAMPLES, not requirements
const EXAMPLE_MARKERS = [
  'e.g.', 'example', 'such as', 'including', 'or no',
  'supported', 'works with', 'does not assume', "doesn't assume",
  'detects:', 'package.json', 'requirements.txt', 'go.mod', 'cargo.toml',
  'detects', 'adapts', 'whether', 'if the project', 'any project',
  'detect', 'or plain', 'or no ',
];

// Mandate contexts where a stack mention IS a requirement
const MANDATE_MARKERS = [
  'must use', 'must be', 'is the', 'truth is', 'uses ', 'default is',
  'all pages', 'all routes', 'all api', 'every page', 'every route',
];

// Framework-core files that MUST stay agnostic
const FRAMEWORK_CORE_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/STRUCTURE.md',
  'docs/coding-standards.md',
  'docs/sdd/sdd.md',
  'docs/README-FOR-AGENTS.md',
  '.specify/memory/constitution.md',
];

// Files explicitly ALLOWED to reference specific stacks
const ALLOWLIST_PATHS = [
  '.env.example',
  'docs/ponytail-setup.md',
  'CREDITS.md',
  'docker-compose.phoenix.yml',
  'pyproject.toml',
  'package.json',
  'README.md',
  'TIERS.md',
  'MASTERPLAN.md',
  'CONTRIBUTING.md',
  'docs/DESIGN.md',
  'docs/evals.md',
  'docs/evolution.md',
  'docs/README.md',
  'docs/frontend/README.md',
  '.agents/handoffs/registry.yaml',
  '.agents/context/README.md',
];

const args = process.argv.slice(2);
const verbose = args.includes('--report');

let violations = 0;

function isAllowlisted(filePath) {
  const rel = relative(root, filePath);
  for (const pattern of ALLOWLIST_PATHS) {
    if (rel === pattern || rel.startsWith(pattern)) return true;
  }
  return false;
}

function isExampleContext(line) {
  const lower = line.toLowerCase();
  // Multiple stack names in one line = comparison/list, not a mandate
  const stackCount = STACK_IDENTIFIERS.filter(id =>
    new RegExp(`\\b${id}\\b`, 'i').test(line) && !FALSE_POSITIVES.some(fp => lower.includes(fp))
  ).length;
  if (stackCount >= 2) return true;

  return EXAMPLE_MARKERS.some(marker => lower.includes(marker));
}

function isMandateContext(line) {
  const lower = line.toLowerCase();
  return MANDATE_MARKERS.some(marker => lower.includes(marker));
}

function checkFile(filePath) {
  if (!existsSync(filePath)) return;
  if (isAllowlisted(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(root, filePath);
  const lines = content.split('\n');

  let inCodeFence = false;

  lines.forEach((line, lineNum) => {
    // Track code fence state
    if (line.trim().startsWith('```')) {
      inCodeFence = !inCodeFence;
      return;
    }
    if (inCodeFence) return; // skip code blocks

    const lowerLine = line.toLowerCase();

    // Skip false positives
    if (FALSE_POSITIVES.some(fp => lowerLine.includes(fp))) return;

    // Check if this line is an example context
    if (isExampleContext(line)) return;

    // Only flag if it's a mandate context
    if (!isMandateContext(line)) return;

    for (const identifier of STACK_IDENTIFIERS) {
      const regex = new RegExp(`\\b${identifier}\\b`, 'i');
      if (regex.test(line)) {
        violations++;
        console.error(`FAIL: ${relPath}:${lineNum + 1}`);
        console.error(`      hardcodes "${identifier}" in a mandate context`);
        console.error(`      Line: ${line.trim().substring(0, 120)}`);
        console.error(`      Framework core files must not mandate a specific stack.`);
        console.error('');
      }
    }
  });
}

for (const file of FRAMEWORK_CORE_FILES) {
  checkFile(join(root, file));
}

if (violations === 0) {
  console.log('PASS: framework-core files are stack-agnostic');
  process.exit(0);
} else {
  console.error(`FAIL: ${violations} mandate-level stack references found`);
  process.exit(1);
}
