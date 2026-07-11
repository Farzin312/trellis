#!/usr/bin/env node
/** Detect one migration convention conservatively, then run structural checks. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const adapterPath = join(dirname(fileURLToPath(import.meta.url)), 'migration-adapters.json');
const args = process.argv.slice(2);

if (args.length > 1 || (args.length === 1 && args[0] !== '--list-adapters')) {
  console.error('Usage: check-migration-safety.mjs [--list-adapters]');
  process.exit(2);
}

let adapters;
try {
  ({ adapters } = JSON.parse(readFileSync(adapterPath, 'utf8')));
} catch (error) {
  console.error(`FAIL: cannot read migration adapters: ${error.message}`);
  process.exit(1);
}

if (args[0] === '--list-adapters') {
  console.log('Static detection metadata (not migration execution support):');
  for (const [key, adapter] of Object.entries(adapters)) {
    console.log(`${key}\t${adapter.displayName}`);
  }
  process.exit(0);
}

function wildcard(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`);
}

function collect(directory, pattern) {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return [];
  if (pattern.includes('/')) {
    const [directoryPattern, filePattern] = pattern.split('/');
    const directoryRegex = wildcard(directoryPattern);
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && directoryRegex.test(entry.name))
      .map((entry) => join(directory, entry.name, filePattern))
      .filter((path) => existsSync(path));
  }
  const matcher = wildcard(pattern);
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => join(directory, entry.name))
    .sort();
}

function packageUsesNodePgMigrate() {
  const path = join(root, 'package.json');
  if (!existsSync(path)) return false;
  try {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    return Boolean(pkg.dependencies?.['node-pg-migrate']
      || pkg.devDependencies?.['node-pg-migrate']
      || Object.values(pkg.scripts || {}).some((script) => /node-pg-migrate/.test(script)));
  } catch {
    return false;
  }
}

function configEvidence(key, adapter) {
  const markers = (adapter.detect.configMarkers || []).filter((marker) => marker !== 'package.json');
  if (key === 'node-pg-migrate' && packageUsesNodePgMigrate()) return true;
  return markers.some((marker) => existsSync(join(root, marker)));
}

function filesFor(adapter) {
  const files = [];
  for (const directory of adapter.detect.dirs || []) {
    files.push(...collect(join(root, directory), adapter.detect.filePattern));
  }
  return [...new Set(files)];
}

const configured = [];
for (const [key, adapter] of Object.entries(adapters)) {
  if (!configEvidence(key, adapter)) continue;
  const files = filesFor(adapter);
  if (files.length > 0) configured.push({ key, adapter, files });
}

if (configured.length > 1) {
  console.error(`FAIL: ambiguous migration tool evidence: ${configured.map(({ key }) => key).sort().join(', ')}`);
  process.exit(1);
}

function rawSqlFiles() {
  const files = [];
  for (const directory of ['migrations', 'db/migrations']) {
    const path = join(root, directory);
    if (!existsSync(path) || !statSync(path).isDirectory()) continue;
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.sql')) files.push(join(path, entry.name));
    }
  }
  return files.sort();
}

function inferUnambiguousSql() {
  const files = rawSqlFiles();
  if (files.length === 0) return null;

  const upFiles = files.filter((path) => /(?:\.up|_up)\.sql$/.test(path));
  const downNames = new Set(files
    .filter((path) => /(?:\.down|_down)\.sql$/.test(path))
    .map((path) => basename(path).replace(/(?:\.down|_down)\.sql$/, '')));
  const paired = upFiles.length > 0 && upFiles.every((path) => {
    const stem = basename(path).replace(/(?:\.up|_up)\.sql$/, '');
    return downNames.has(stem);
  }) && files.length === upFiles.length * 2;
  if (paired) return { key: 'golang-migrate', adapter: adapters['golang-migrate'], files };

  if (files.every((path) => /^V\d+__.+\.sql$/.test(basename(path)))) {
    return { key: 'flyway', adapter: adapters.flyway, files };
  }
  if (files.every((path) => /--\s*\+goose\s+Up/i.test(readFileSync(path, 'utf8')))) {
    return { key: 'goose', adapter: adapters.goose, files };
  }
  return null;
}

const detected = configured[0] || inferUnambiguousSql();
if (!detected) {
  console.log('SKIP: no unambiguous migration tool detected');
  process.exit(0);
}

let errors = 0;
let warnings = 0;
if (detected.key !== 'golang-migrate') {
  const versions = new Map();
  const pattern = new RegExp(detected.adapter.versionPattern);
  for (const file of detected.files) {
    const versionSource = detected.adapter.versionFromParent ? basename(dirname(file)) : basename(file);
    const version = versionSource.match(pattern)?.[1];
    if (!version) continue;
    if (versions.has(version)) {
      console.error(`FAIL: duplicate migration version ${version}: ${basename(versions.get(version))}, ${basename(file)}`);
      errors++;
    } else {
      versions.set(version, file);
    }
  }
}

for (const file of detected.files) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["`]?([\w-]+)/gi)) {
    if (!detected.adapter.rlsCheckable) break;
    const table = match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sqlRls = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?["\`]?(?:${table})["\`]?\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (!sqlRls.test(content) && !new RegExp(`enableRls\\s*\\(\\s*["']${table}["']`, 'i').test(content)) {
      console.warn(`WARN: ${basename(file)} creates ${match[1]} without an RLS statement`);
      warnings++;
    }
  }
  if (/ON\s+DELETE\s+CASCADE/i.test(content) && !/trellis:\s*allow-cascade/i.test(content)) {
    console.warn(`WARN: ${basename(file)} uses ON DELETE CASCADE without a trellis justification`);
    warnings++;
  }
}

if (errors > 0) {
  console.error(`FAIL migration-static-check tool=${detected.key} files=${detected.files.length} errors=${errors} warnings=${warnings}`);
  process.exit(1);
}
console.log(`PASS migration-static-check tool=${detected.key} files=${detected.files.length} warnings=${warnings}`);
