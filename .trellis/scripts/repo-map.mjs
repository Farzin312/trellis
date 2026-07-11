#!/usr/bin/env node
/** Produce a bounded, read-only structural repository map. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--json')) {
  console.error('Usage: repo-map.mjs [--json]');
  process.exit(2);
}

const MAX_FILES = 100_000;
const MAX_READ_BYTES = 1_000_000;
const MAX_MANIFESTS = 100;
const MAX_SYSTEMS = 50;
const MAX_TOP_LEVEL = 100;
const excludedDirectories = new Set([
  '.git',
  '.aws',
  '.gnupg',
  '.kube',
  '.next',
  '.ssh',
  '.specify/specs',
  '.trellis/metrics',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'graphify-out',
  'node_modules',
  'target',
  'vendor',
]);
const manifestNames = new Set([
  'Cargo.toml',
  'Gemfile',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'deno.json',
  'deno.jsonc',
  'go.mod',
  'package.json',
  'pom.xml',
  'pyproject.toml',
  'requirements.txt',
  'tsconfig.json',
]);
const sensitiveNames = /^(?:\.env(?:\..*)?|\.netrc|\.npmrc|\.pypirc|credentials(?:\.json)?|id_(?:dsa|ecdsa|ed25519|rsa)|.*(?:service[-_]?account|credential).*\.json|.*\.(?:key|pem|p12|pfx))$/i;
const testName = /(?:^|[._-])(?:test|spec)(?:[._-]|$)|^test_/i;
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

let acceptedFiles = 0;
let truncated = false;
const files = [];

function excluded(relativePath, name, isDirectory) {
  if (sensitiveNames.test(name) && name !== '.env.example') return true;
  if (!isDirectory) return false;
  return excludedDirectories.has(relativePath)
    || excludedDirectories.has(name)
    || /(?:^|\/)\.specify\/specs(?:\/|$)/.test(relativePath)
    || /(?:^|\/)\.trellis\/metrics(?:\/|$)/.test(relativePath);
}

function walk(directory) {
  if (acceptedFiles >= MAX_FILES) {
    truncated = true;
    return;
  }
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => compare(a.name, b.name));
  } catch {
    return;
  }

  for (const entry of entries) {
    if (acceptedFiles >= MAX_FILES) {
      truncated = true;
      return;
    }
    const path = join(directory, entry.name);
    const rel = relative(root, path).split('\\').join('/');
    if (entry.isSymbolicLink() || excluded(rel, entry.name, entry.isDirectory())) continue;
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!entry.isFile()) continue;
    let size = 0;
    try { size = statSync(path).size; } catch { continue; }
    files.push({ path: rel, size });
    acceptedFiles++;
  }
}

walk(root);

const warnings = [];
let config = null;
const configPath = join(root, '.trellis', 'config.json');
if (existsSync(configPath)) {
  try {
    if (statSync(configPath).size > MAX_READ_BYTES) throw new Error(`file exceeds ${MAX_READ_BYTES} bytes`);
    config = validateConfig(JSON.parse(readFileSync(configPath, 'utf8')));
  } catch (error) {
    warnings.push(`invalid .trellis/config.json: ${error.message}`);
    config = null;
  }
}

const manifests = files
  .map(({ path }) => path)
  .filter((path) => manifestNames.has(basename(path)))
  .slice(0, MAX_MANIFESTS);

function detectedStacks() {
  if (Array.isArray(config?.stacks) && config.stacks.every((stack) => typeof stack === 'string')) {
    return [...new Set(config.stacks)];
  }
  const names = new Set(manifests.map((path) => basename(path)));
  const stacks = [];
  if (names.has('package.json') || names.has('deno.json') || names.has('deno.jsonc') || names.has('tsconfig.json')) {
    stacks.push(names.has('tsconfig.json') ? 'typescript' : 'javascript');
  }
  if (names.has('pyproject.toml') || names.has('requirements.txt')) stacks.push('python');
  if (names.has('go.mod')) stacks.push('go');
  if (names.has('Cargo.toml')) stacks.push('rust');
  return stacks.length ? stacks : ['generic'];
}

function extension(path) {
  const name = basename(path);
  if (manifestNames.has(name)) return name;
  return extname(name).toLowerCase() || '[none]';
}

const topLevel = new Map();
const extensions = new Map();
let tests = 0;
let docs = 0;
let totalBytes = 0;
for (const file of files) {
  const [first, ...rest] = file.path.split('/');
  const group = rest.length ? first : '[root]';
  const value = topLevel.get(group) || { path: group, files: 0, bytes: 0 };
  value.files++;
  value.bytes += file.size;
  topLevel.set(group, value);
  const ext = extension(file.path);
  extensions.set(ext, (extensions.get(ext) || 0) + 1);
  if (testName.test(basename(file.path))) tests++;
  if (file.path.endsWith('.md')) docs++;
  totalBytes += file.size;
}

function publicSurface(content) {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => /^## Public Surface\s*$/i.test(line));
  if (start === -1) return [];
  const items = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s+/.test(line)) break;
    const item = line.match(/^\s*[-*]\s+(.+)$/)?.[1]?.trim();
    if (item) items.push(item);
    if (items.length === 20) break;
  }
  return items;
}

const systemsPrefix = 'docs/systems/';
const fileSizes = new Map(files.map((file) => [file.path, file.size]));
const systems = files
  .map(({ path }) => path)
  .filter((path) => path.startsWith(systemsPrefix) && path.endsWith('/README.md'))
  .filter((path) => path !== 'docs/systems/README.md')
  .slice(0, MAX_SYSTEMS)
  .map((path) => {
    let content = '';
    if ((fileSizes.get(path) || 0) > MAX_READ_BYTES) {
      warnings.push(`${path} exceeds ${MAX_READ_BYTES} bytes; title and public surface were not read`);
    } else {
      try { content = readFileSync(join(root, path), 'utf8'); } catch { /* keep structural entry */ }
    }
    const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || basename(dirname(path));
    return {
      name: relative(join(root, 'docs', 'systems'), dirname(join(root, path))).split('\\').join('/'),
      path,
      title,
      public_surface: publicSurface(content),
    };
  });

const enabled = new Set(Array.isArray(config?.enabled_integrations) ? config.enabled_integrations : []);
const orderedTopLevel = [...topLevel.values()]
  .sort((a, b) => compare(a.path, b.path));
const map = {
  schema_version: 1,
  root: basename(root),
  stacks: detectedStacks(),
  manifests,
  summary: {
    files: files.length,
    bytes: totalBytes,
    tests,
    docs,
  },
  top_level: orderedTopLevel.slice(0, MAX_TOP_LEVEL),
  omitted_top_level: Math.max(0, orderedTopLevel.length - MAX_TOP_LEVEL),
  extensions: Object.fromEntries([...extensions].sort(([a], [b]) => compare(a, b))),
  systems,
  integrations: {
    bounds: enabled.has('bounds'),
    graphify: enabled.has('graphify'),
  },
  truncated,
  warnings,
};

if (args[0] === '--json') {
  process.stdout.write(`${JSON.stringify(map, null, 2)}\n`);
  process.exit(0);
}

console.log('TRELLIS REPOSITORY MAP');
console.log(`root: ${map.root}`);
console.log(`stacks: ${map.stacks.join(', ')}`);
console.log(`manifests: ${map.manifests.length ? map.manifests.join(', ') : 'none'}`);
console.log(`files: ${map.summary.files}  tests: ${map.summary.tests}  docs: ${map.summary.docs}  bytes: ${map.summary.bytes}`);
console.log(`top-level groups: ${map.top_level.length}${map.omitted_top_level ? ` (+${map.omitted_top_level} omitted)` : ''}`);
for (const group of map.top_level.slice(0, 25)) {
  console.log(`  ${group.path}: files=${group.files} bytes=${group.bytes}`);
}
if (map.top_level.length > 25) console.log(`  ... ${map.top_level.length - 25} more groups; use --json`);
console.log(`documented systems: ${map.systems.length}`);
for (const system of map.systems) console.log(`  ${system.name}: ${system.title} (${system.path})`);
console.log(`Graphify: ${map.integrations.graphify ? 'configured' : 'not configured'} — optional deeper symbol/dependency graph`);
console.log(`Bounds: ${map.integrations.bounds ? 'configured' : 'not configured'} — optional boundary enforcement`);
if (map.truncated) console.log(`WARN: scan stopped at ${MAX_FILES} files`);
for (const warning of map.warnings) console.log(`WARN: ${warning}`);
