#!/usr/bin/env node
/** Adapt Trellis-owned project metadata to canonical root-language stacks. */

import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProjectConfig, writeProjectConfig } from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const allowedStacks = ['generic', 'javascript', 'typescript', 'python', 'go', 'rust'];

class UsageError extends Error {}

function parseArgs(args) {
  let value;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--stack') {
      if (value !== undefined || !args[index + 1]) throw new UsageError('--stack requires one value');
      value = args[++index];
    } else if (arg.startsWith('--stack=')) {
      if (value !== undefined) throw new UsageError('--stack may only be provided once');
      value = arg.slice('--stack='.length);
    } else {
      throw new UsageError(`Unknown argument: ${arg}`);
    }
  }
  return value;
}

function parseStacks(value) {
  const parts = value.split(',').map((part) => part.trim());
  if (parts.some((part) => !part)) throw new UsageError('--stack contains an empty value');

  const unknown = parts.find((part) => !allowedStacks.includes(part));
  if (unknown) throw new UsageError(`Unsupported stack: ${unknown}. Expected: ${allowedStacks.join(', ')}`);

  const stacks = [...new Set(parts)];
  if (stacks.includes('generic') && stacks.length > 1) {
    throw new UsageError('generic cannot be combined with another stack');
  }
  return stacks;
}

function detectStacks() {
  const stacks = [];
  const packagePath = join(root, 'package.json');
  const hasPackage = existsSync(packagePath);
  const hasTypeScriptConfig = existsSync(join(root, 'tsconfig.json'));

  if (hasPackage || hasTypeScriptConfig) {
    let usesTypeScript = hasTypeScriptConfig;
    if (hasPackage) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      if (!pkg || Array.isArray(pkg) || typeof pkg !== 'object') {
        throw new Error('package.json must contain a JSON object');
      }
      const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
      usesTypeScript ||= Boolean(dependencies.typescript);
    }
    stacks.push(usesTypeScript ? 'typescript' : 'javascript');
  }
  if (existsSync(join(root, 'requirements.txt')) || existsSync(join(root, 'pyproject.toml'))) {
    stacks.push('python');
  }
  if (existsSync(join(root, 'go.mod'))) stacks.push('go');
  if (existsSync(join(root, 'Cargo.toml'))) stacks.push('rust');
  return stacks.length ? stacks : ['generic'];
}

function writeIfChanged(path, content) {
  if (readFileSync(path, 'utf8') === content) return false;
  const temporary = join(dirname(path), `.${basename(path)}.tmp-${process.pid}-${Date.now()}`);
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', statSync(path).mode & 0o777);
    writeFileSync(descriptor, content, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
  return true;
}

function validateAgentsTarget() {
  const path = join(root, 'AGENTS.md');
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    throw new Error('AGENTS.md must not be a symbolic link');
  }
}

function adaptAgents(stacks) {
  const path = join(root, 'AGENTS.md');
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  const managedBlock = /(<!-- trellis:scope:start -->\s*)[\s\S]*?(\s*<!-- trellis:scope:end -->)/;
  if (managedBlock.test(content)) {
    const next = content.replace(
      managedBlock,
      `$1\nThis repo owns: a project built with ${stacks.join(', ')}. Define its precise scope here.\n$2`,
    );
    console.log(`  [${writeIfChanged(path, next) ? 'OK' : 'KEEP'}] AGENTS.md managed scope`);
    return;
  }
  const managedScope = /This repo owns: (?:\[describe what this project is[^\]\n]*\]\.?|a project built with [^\n]+\. Fill in the detailed scope\.)/;
  if (!managedScope.test(content)) {
    console.log('  [KEEP] AGENTS.md scope is user-managed');
    return;
  }

  const next = content.replace(
    managedScope,
    `This repo owns: a project built with ${stacks.join(', ')}. Fill in the detailed scope.`,
  );
  console.log(`  [${writeIfChanged(path, next) ? 'OK' : 'KEEP'}] AGENTS.md managed scope`);
}

function adaptConfig(stacks) {
  const path = join(root, '.trellis', 'config.json');
  if (!existsSync(path)) return;
  const config = readProjectConfig(root);
  if (JSON.stringify(config.stacks) === JSON.stringify(stacks)) {
    console.log('  [KEEP] .trellis/config.json stacks');
    return;
  }
  writeProjectConfig(root, { ...config, stacks });
  console.log(`  [OK] .trellis/config.json stacks: ${stacks.join(', ')}`);
}

function main() {
  if (!existsSync(join(root, '.trellis', 'config.json'))) {
    throw new Error('missing .trellis/config.json; run trellis init first');
  }
  const explicit = parseArgs(process.argv.slice(2));
  const stacks = explicit === undefined ? detectStacks() : parseStacks(explicit);
  validateAgentsTarget();
  console.log(`Detected stacks: ${stacks.join(', ')}`);
  adaptConfig(stacks);
  adaptAgents(stacks);
  console.log('Adaptation complete. Review the managed project scope for accuracy.');
}

try {
  main();
} catch (error) {
  if (error instanceof UsageError) {
    console.error(`USAGE: ${error.message}`);
    process.exitCode = 2;
  } else {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
