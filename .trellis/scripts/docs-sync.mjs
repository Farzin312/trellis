#!/usr/bin/env node
/**
 * docs-sync.mjs
 *
 * The documentation accuracy pipeline. Runs in two modes:
 *   --check: read-only verification (CI gate). Fails on drift.
 *   default: regenerates auto-docs + fixes breadcrumbs.
 *
 * Steps:
 *   1. Check/fix parent-child breadcrumbs on all docs
 *   2. Check for broken doc links
 *   3. (Future) regenerate API reference from JSDoc
 *   4. (Future) regenerate bug-fix index
 *   5. (Future) regenerate table snapshots from migrations
 *
 * Usage:
 *   node .trellis/scripts/docs-sync.mjs            # regenerate + fix
 *   node .trellis/scripts/docs-sync.mjs --check    # read-only verification
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const docsDir = join(root, 'docs');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');

if (!existsSync(docsDir)) {
  console.log('SKIP: no docs/ directory');
  process.exit(0);
}

let errors = 0;
let fixed = 0;

// ── Step 1: Breadcrumb checks ──────────────────────────────────────────

function getAllDocs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllDocs(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const docs = getAllDocs(docsDir);

for (const doc of docs) {
  const content = readFileSync(doc, 'utf8');
  const relPath = relative(docsDir, doc);
  const lines = content.split('\n');

  // Check: every doc should have a > Parent: line (except README.md and STRUCTURE.md at top level)
  const isTopLevelIndex = relPath === 'README.md' || relPath === 'STRUCTURE.md' || relPath === 'README-FOR-AGENTS.md';
  const hasParent = content.match(/^>\s*Parent:/m);

  if (!isTopLevelIndex && !hasParent) {
    if (checkOnly) {
      console.error(`FAIL: ${relPath} missing "> Parent:" breadcrumb`);
      errors++;
    } else {
      // Can't auto-fix parent (we don't know the correct parent)
      console.warn(`WARN: ${relPath} missing "> Parent:" breadcrumb — add manually`);
    }
  }

  // Check: all markdown links resolve to real files
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkTarget = match[2];
    // Skip http links and anchors
    if (linkTarget.startsWith('http') || linkTarget.startsWith('#')) continue;
    // Strip any #anchor
    const filePath = linkTarget.split('#')[0];
    if (!filePath) continue;
    const resolved = join(dirname(doc), filePath);
    if (!existsSync(resolved)) {
      console.error(`FAIL: ${relPath} has broken link: [${linkText}](${linkTarget})`);
      errors++;
    }
  }
}

if (checkOnly) {
  if (errors === 0) {
    console.log('PASS: docs-sync check — no drift detected');
    process.exit(0);
  } else {
    console.error(`FAIL: docs-sync check — ${errors} errors found`);
    process.exit(1);
  }
} else {
  console.log(`PASS: docs-sync complete — ${fixed} fixes applied, ${errors} errors remaining`);
  process.exit(0);
}
