#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const counts = {
  required_pass: 0,
  required_fail: 0,
  optional_pass: 0,
  optional_skip: 0,
  optional_warn: 0,
};
const DISCOVERY_EXCLUDES = new Set([
  '.cache',
  '.git',
  '.next',
  '.trellis',
  '.turbo',
  '.venv',
  'build',
  'coverage',
  'dist',
  'graphify-out',
  'node_modules',
  'target',
  'vendor',
  'venv',
]);

function report(status, kind, name, detail = '') {
  counts[`${kind}_${status.toLowerCase()}`]++;
  console.log(`${status} ${kind} ${name}${detail ? ` reason=${detail}` : ''}`);
}

function runRequired(name, command, args) {
  // Node's test runner sets NODE_TEST_CONTEXT. Do not leak it into nested
  // project test processes, where it changes reporter and exit semantics.
  const { NODE_TEST_CONTEXT: _testContext, ...cleanEnv } = process.env;
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: cleanEnv });
  if (!result.error && result.status === 0) {
    report('PASS', 'required', name);
    return;
  }
  const detail = result.error?.code === 'ENOENT'
    ? `missing-command:${command}`
    : `exit-${result.status ?? 1}`;
  report('FAIL', 'required', name, detail);
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (output) console.error(output);
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (DISCOVERY_EXCLUDES.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function readPackage(path) {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    return value && !Array.isArray(value) && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

const selfTestDir = join(root, '.trellis', 'tests');
const selfTests = existsSync(selfTestDir)
  ? readdirSync(selfTestDir)
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => join(selfTestDir, name))
  : [];

if (selfTests.length === 0) {
  report('FAIL', 'required', 'framework-self-tests', 'no-test-files');
} else {
  runRequired('framework-self-tests', process.execPath, ['--test', ...selfTests]);
}

const projectFiles = walk(root);
const jsTests = projectFiles.filter((path) => /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/.test(path));
const pythonTests = projectFiles.filter((path) => /(?:^|\/)(?:test_.*|.*_test)\.py$/.test(path));
const goTests = projectFiles.filter((path) => /_test\.go$/.test(path));
const rustFiles = projectFiles.filter((path) => path.endsWith('.rs'));
let detectedManifest = false;
let projectAggregateConfigured = false;

const packagePath = join(root, 'package.json');
if (existsSync(packagePath)) {
  detectedManifest = true;
  const pkg = readPackage(packagePath);
  if (!pkg) {
    report('FAIL', 'required', 'javascript-project-tests', 'invalid-package-json');
  } else if (typeof pkg.scripts?.['check:project'] === 'string' && pkg.scripts['check:project'].trim()) {
    projectAggregateConfigured = true;
    const projectCommand = pkg.scripts['check:project'];
    const checkCommand = typeof pkg.scripts.check === 'string' ? pkg.scripts.check : '';
    const testCommand = typeof pkg.scripts.test === 'string' ? pkg.scripts.test : '';
    const recursive = /(?:^|\s)trellis\s+(?:check|eval)(?:\s|$)|\.trellis\/scripts\/run-evals\.mjs/.test(projectCommand)
      || (/\bnpm\s+(?:run\s+)?check(?:\s|$)/.test(projectCommand)
        && /(?:trellis\s+(?:check|eval)|\.trellis\/scripts\/run-evals\.mjs)/.test(checkCommand))
      || (/\bnpm\s+(?:run\s+)?test(?:\s|$)/.test(projectCommand)
        && /\.trellis\/scripts\/run-evals\.mjs/.test(testCommand));
    if (recursive) {
      report('FAIL', 'required', 'project-check', 'recursive-project-check');
    } else {
      runRequired(
        'project-check',
        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['run', 'check:project'],
      );
    }
  } else if (typeof pkg.scripts?.['test:project'] === 'string' && pkg.scripts['test:project'].trim()) {
    const projectCommand = pkg.scripts['test:project'];
    const testCommand = typeof pkg.scripts.test === 'string' ? pkg.scripts.test : '';
    const recursive = /(?:^|\s)trellis\s+eval(?:\s|$)|\.trellis\/scripts\/run-evals\.mjs/.test(projectCommand)
      || (/\bnpm\s+(?:run\s+)?test(?:\s|$)/.test(projectCommand)
        && /\.trellis\/scripts\/run-evals\.mjs/.test(testCommand));
    if (recursive) {
      report('FAIL', 'required', 'javascript-project-tests', 'recursive-test-command');
    } else {
      runRequired(
        'javascript-project-tests',
        process.platform === 'win32' ? 'npm.cmd' : 'npm',
        ['run', 'test:project'],
      );
    }
  } else if (jsTests.length > 0) {
    report('WARN', 'optional', 'javascript-project-tests', 'test-files-without-test:project');
  } else {
    report('SKIP', 'optional', 'javascript-project-tests', 'not-configured');
  }
}

const pyprojectPath = join(root, 'pyproject.toml');
const requirementsPath = join(root, 'requirements.txt');
if (!projectAggregateConfigured && (existsSync(pyprojectPath) || existsSync(requirementsPath))) {
  detectedManifest = true;
  if (pythonTests.length === 0) {
    report('SKIP', 'optional', 'python-project-tests', 'no-test-evidence');
  } else {
    const pyproject = existsSync(pyprojectPath) ? readFileSync(pyprojectPath, 'utf8') : '';
    const requirements = existsSync(requirementsPath) ? readFileSync(requirementsPath, 'utf8') : '';
    const pytest = existsSync(join(root, 'pytest.ini'))
      || /\[tool\.pytest(?:\.|\])/.test(pyproject)
      || /^pytest(?:\W|$)/im.test(requirements);
    runRequired(
      'python-project-tests',
      process.platform === 'win32' ? 'python' : 'python3',
      pytest ? ['-m', 'pytest', '-q'] : ['-m', 'unittest', 'discover'],
    );
  }
}

if (!projectAggregateConfigured && existsSync(join(root, 'go.mod'))) {
  detectedManifest = true;
  if (goTests.length > 0) runRequired('go-project-tests', 'go', ['test', './...']);
  else report('SKIP', 'optional', 'go-project-tests', 'no-test-evidence');
}

if (!projectAggregateConfigured && existsSync(join(root, 'Cargo.toml'))) {
  detectedManifest = true;
  const hasRustTests = rustFiles.some((path) => path.includes(`${join(root, 'tests')}/`)
    || readFileSync(path, 'utf8').includes('#[test]'));
  if (hasRustTests) runRequired('rust-project-tests', 'cargo', ['test']);
  else report('SKIP', 'optional', 'rust-project-tests', 'no-test-evidence');
}

if (!detectedManifest) report('SKIP', 'optional', 'project-tests', 'no-project-manifest');

console.log(`RESULT required_pass=${counts.required_pass} required_fail=${counts.required_fail} optional_pass=${counts.optional_pass} optional_skip=${counts.optional_skip} optional_warn=${counts.optional_warn}`);
process.exit(counts.required_fail > 0 ? 1 : 0);
