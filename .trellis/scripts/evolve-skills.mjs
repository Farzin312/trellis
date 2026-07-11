#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceDir = join(root, '.agents', 'skills');
const mirrorDir = join(root, '.claude', 'skills');
const verbose = process.argv.includes('--report');
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function filesUnder(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path, base));
    else files.push(relative(base, path));
  }
  return files.sort();
}

function frontmatterDescription(frontmatter) {
  const lines = frontmatter.split('\n');
  const index = lines.findIndex((line) => line.startsWith('description:'));
  if (index === -1) return '';
  const inline = lines[index].slice('description:'.length).trim();
  if (inline && inline !== '|' && inline !== '>') return inline;
  const parts = [];
  for (const line of lines.slice(index + 1)) {
    if (!/^\s+/.test(line)) break;
    parts.push(line.trim());
  }
  return parts.join(' ');
}

if (!existsSync(sourceDir)) {
  fail('.agents/skills is missing');
} else {
  const names = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (names.length === 0) fail('.agents/skills is empty');

  for (const name of names) {
    const source = join(sourceDir, name);
    const skillFile = join(source, 'SKILL.md');
    const mirror = join(mirrorDir, name);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) fail(`${name}: invalid directory name`);
    if (!existsSync(skillFile)) {
      fail(`${name}: SKILL.md is missing`);
      continue;
    }

    const content = readFileSync(skillFile, 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    const declaredName = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter ? frontmatterDescription(frontmatter[1]) : '';
    if (!frontmatter) fail(`${name}: YAML frontmatter is missing`);
    if (declaredName !== name) fail(`${name}: frontmatter name must match directory`);
    if (!description || description.length > 1024) fail(`${name}: description must be 1-1024 characters`);
    if (statSync(skillFile).size > 20_000) fail(`${name}: SKILL.md exceeds 20KB`);

    if (!existsSync(mirror)) {
      fail(`${name}: Claude mirror is missing`);
      continue;
    }
    const sourceFiles = filesUnder(source);
    const mirrorFiles = filesUnder(mirror);
    if (JSON.stringify(sourceFiles) !== JSON.stringify(mirrorFiles)) {
      fail(`${name}: Claude mirror file list differs`);
      continue;
    }
    for (const path of sourceFiles) {
      if (readFileSync(join(source, path)).compare(readFileSync(join(mirror, path))) !== 0) {
        fail(`${name}: Claude mirror differs at ${path}`);
      }
    }
    if (verbose) console.log(`OK: ${name}`);
  }
}

if (failures > 0) {
  console.error(`FAIL: ${failures} skill health issue(s)`);
  process.exit(1);
}

console.log('PASS: canonical Agent Skills and Claude mirror are healthy');
