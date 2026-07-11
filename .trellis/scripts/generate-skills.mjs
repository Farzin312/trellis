#!/usr/bin/env node

import {
  closeSync,
  cpSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sourceDir = join(root, '.agents', 'skills');
const targetDir = join(root, '.claude', 'skills');
const manifestPath = join(root, '.trellis', 'generated-skills.json');
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const GENERATED_PATH = /^\.claude\/skills\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function rejectSymlink(path, label) {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    fail(`${label} must not be a symbolic link`);
  }
}

function validateTree(path, label) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isSymbolicLink()) fail(`${label} contains a symbolic link: ${relative(root, child)}`);
    else if (entry.isDirectory()) validateTree(child, label);
    else if (!entry.isFile()) fail(`${label} contains an unsupported filesystem entry: ${relative(root, child)}`);
  }
}

rejectSymlink(join(root, '.agents'), 'canonical skill parent');
rejectSymlink(sourceDir, 'canonical skill root');
rejectSymlink(join(root, '.claude'), 'Claude configuration root');
rejectSymlink(targetDir, 'Claude skill mirror');
rejectSymlink(manifestPath, 'generated skill manifest');

if (!existsSync(sourceDir)) {
  console.error('FAIL: canonical .agents/skills directory is missing');
  process.exit(1);
}

const names = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (names.length === 0) {
  fail('canonical .agents/skills directory is empty');
}

for (const name of names) {
  if (!SKILL_NAME.test(name) || name.length > 64) fail(`invalid canonical skill directory: ${name}`);
  const source = join(sourceDir, name);
  if (!existsSync(join(source, 'SKILL.md'))) fail(`${name}: SKILL.md is missing`);
  validateTree(source, `canonical skill ${name}`);
}
if (existsSync(targetDir)) validateTree(targetDir, 'Claude skill mirror');

let previous = [];
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.schema_version !== 1 || !Array.isArray(manifest.files)
      || manifest.files.some((path) => typeof path !== 'string' || !GENERATED_PATH.test(path))
      || new Set(manifest.files).size !== manifest.files.length) {
      fail('.trellis/generated-skills.json has an unsafe or unsupported schema');
    }
    previous = manifest.files;
  } catch {
    fail('.trellis/generated-skills.json is invalid');
  }
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

const files = names.map((name) => relative(root, join(targetDir, name)).split('\\').join('/'));
for (const stale of previous.filter((path) => !files.includes(path))) {
  rmSync(join(root, stale), { recursive: true, force: true });
}

const manifest = `${JSON.stringify({ schema_version: 1, files }, null, 2)}\n`;
const temporaryManifest = `${manifestPath}.tmp-${process.pid}-${Date.now()}`;
let descriptor;
try {
  descriptor = openSync(temporaryManifest, 'wx', 0o644);
  writeFileSync(descriptor, manifest, 'utf8');
  fsyncSync(descriptor);
  closeSync(descriptor);
  descriptor = undefined;
  renameSync(temporaryManifest, manifestPath);
} catch (error) {
  if (descriptor !== undefined) closeSync(descriptor);
  if (existsSync(temporaryManifest)) unlinkSync(temporaryManifest);
  throw error;
}

console.log(`PASS: mirrored ${names.length} Agent Skills to .claude/skills`);
