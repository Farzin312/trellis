#!/usr/bin/env node
/** Read-only documentation structure and local-link validation. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const docsRoot = join(root, 'docs');
const args = process.argv.slice(2);

if (args.length > 0) {
  console.error('Usage: check-docs.mjs');
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
const rootDocs = ['README.md', 'AGENTS.md', 'CLAUDE.md']
  .map((path) => join(root, path))
  .filter((path) => existsSync(path));
for (const doc of [...rootDocs, ...markdownFiles(docsRoot)]) {
  const relativePath = relative(root, doc);
  const docsRelative = relative(docsRoot, doc);
  const content = readFileSync(doc, 'utf8');
  const insideDocs = !docsRelative.startsWith('..');
  const topLevelExempt = insideDocs && !docsRelative.includes('/')
    && ['README.md', 'STRUCTURE.md'].includes(docsRelative);

  if (insideDocs && !topLevelExempt && !/^> Parent:\s+/m.test(content)) {
    console.error(`FAIL: ${relativePath} missing > Parent: breadcrumb`);
    errors++;
  }

  const text = withoutCode(content);
  const linkPattern = /!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = linkTarget(doc, match[1]);
    if (!target) continue;
    const rootRelative = relative(root, target);
    if (rootRelative === '..' || rootRelative.startsWith(`..${sep}`) || isAbsolute(rootRelative)) {
      console.error(`FAIL: ${relativePath} has non-portable link outside repository: ${match[1]}`);
      errors++;
      continue;
    }
    let exists = false;
    try {
      const stat = statSync(target);
      exists = stat.isFile() || (stat.isDirectory() && existsSync(join(target, 'README.md')));
    } catch { /* reported below */ }
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

console.log('PASS: documentation structure and local file links valid');
