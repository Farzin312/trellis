#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceDir = join(root, '.agents', 'skills');
const targetDir = join(root, '.claude', 'skills');
const manifestPath = join(root, '.trellis', 'generated-skills.json');

if (!existsSync(sourceDir)) {
  console.error('FAIL: canonical .agents/skills directory is missing');
  process.exit(1);
}

const names = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (names.length === 0) {
  console.error('FAIL: canonical .agents/skills directory is empty');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

for (const name of names) {
  const source = join(sourceDir, name);
  const target = join(targetDir, name);
  const temporary = join(targetDir, `.${name}.tmp-${process.pid}`);
  const backup = join(targetDir, `.${name}.bak-${process.pid}`);

  rmSync(temporary, { recursive: true, force: true });
  cpSync(source, temporary, { recursive: true });
  try {
    if (existsSync(target)) renameSync(target, backup);
    renameSync(temporary, target);
    rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true });
    if (existsSync(backup) && !existsSync(target)) renameSync(backup, target);
    throw error;
  }
}

let previous = [];
if (existsSync(manifestPath)) {
  try {
    previous = JSON.parse(readFileSync(manifestPath, 'utf8')).files || [];
  } catch {
    console.error('FAIL: .trellis/generated-skills.json is invalid');
    process.exit(1);
  }
}

const files = names.map((name) => relative(root, join(targetDir, name)));
for (const stale of previous.filter((path) => !files.includes(path))) {
  if (!stale.startsWith('.claude/skills/')) {
    console.error(`FAIL: refusing to prune unmanaged path ${stale}`);
    process.exit(1);
  }
  rmSync(join(root, stale), { recursive: true, force: true });
}

const manifest = `${JSON.stringify({ schema_version: 1, files }, null, 2)}\n`;
const temporaryManifest = `${manifestPath}.tmp-${process.pid}`;
writeFileSync(temporaryManifest, manifest);
renameSync(temporaryManifest, manifestPath);

console.log(`PASS: mirrored ${names.length} Agent Skills to .claude/skills`);
