#!/usr/bin/env node
/** Read-only documentation structure and local-link validation. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const docsRoot = join(root, 'docs');
const args = process.argv.slice(2);

if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
  console.error('Usage: docs-sync.mjs [--check]');
  process.exit(2);
}

if (!existsSync(docsRoot)) {
  console.log('SKIP: no docs directory');
  process.exit(0);
}

function markdownFiles(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) markdownFiles(path, output);
    else if (entry.isFile() && entry.name.endsWith('.md')) output.push(path);
  }
  return output.sort();
}

function withoutCode(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
}

function linkTarget(doc, rawTarget) {
  const clean = rawTarget.trim().replace(/^<|>$/g, '');
  if (!clean || clean.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(clean)) return null;
  const pathPart = clean.split('#', 1)[0].split('?', 1)[0];
  if (!pathPart) return null;
  try {
    return resolve(dirname(doc), decodeURIComponent(pathPart));
  } catch {
    return resolve(dirname(doc), pathPart);
  }
}

let errors = 0;
for (const doc of markdownFiles(docsRoot)) {
  const relativePath = relative(root, doc);
  const docsRelative = relative(docsRoot, doc);
  const content = readFileSync(doc, 'utf8');
  const topLevelExempt = !docsRelative.includes('/') && ['README.md', 'STRUCTURE.md'].includes(docsRelative);

  if (!topLevelExempt && !/^> Parent:\s+/m.test(content)) {
    console.error(`FAIL: ${relativePath} missing > Parent: breadcrumb`);
    errors++;
  }

  const text = withoutCode(content);
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = linkTarget(doc, match[1]);
    if (!target) continue;
    const exists = existsSync(target)
      && (statSync(target).isFile() || (statSync(target).isDirectory() && existsSync(join(target, 'README.md'))));
    if (!exists) {
      console.error(`FAIL: ${relativePath} has broken link: ${match[1]}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`FAIL: documentation structure has ${errors} error(s)`);
  process.exit(1);
}

console.log('PASS: documentation structure and local links valid');
