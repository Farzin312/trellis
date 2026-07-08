#!/usr/bin/env node
/**
 * run-evals.mjs
 *
 * Runs the full evaluation suite:
 *   1. Unit + integration tests (vitest)
 *   2. Property-based tests (fast-check, integrated in vitest)
 *   3. Mutation testing (stryker)
 *   4. Golden tests (per-spec locked suites)
 *   5. Ponytail marker format check (advisory)
 *
 * Usage: node .trellis/scripts/run-evals.mjs
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const metricsDir = join(root, '.trellis', 'metrics');

let failures = 0;

function logMetric(name, durationMs, result) {
  mkdirSync(metricsDir, { recursive: true });
  const record = JSON.stringify({
    ts: new Date().toISOString(),
    agent: 'eval',
    model: 'n/a',
    phase: name,
    tokens_in: 0,
    tokens_out: 0,
    est_cost_usd: 0,
    tool_calls: 0,
    duration_ms: durationMs,
    result: result,
  });
  appendFileSync(join(metricsDir, 'runs.jsonl'), record + '\n');
}

function runStep(name, command, required = true) {
  console.log(`\n── ${name} ──`);
  const start = Date.now();
  try {
    execSync(command, { cwd: root, stdio: 'inherit' });
    console.log(`PASS: ${name}`);
    logMetric(name, Date.now() - start, 'pass');
  } catch (e) {
    if (required) {
      console.error(`FAIL: ${name}`);
      failures++;
      logMetric(name, Date.now() - start, 'fail');
    } else {
      console.warn(`WARN: ${name} (non-blocking)`);
      logMetric(name, Date.now() - start, 'warn');
    }
  }
}

// Step 1: Unit + integration tests
const hasPackageJson = existsSync(join(root, 'package.json'));
const hasRequirementsTxt = existsSync(join(root, 'requirements.txt'));
const hasGoMod = existsSync(join(root, 'go.mod'));
const hasCargoToml = existsSync(join(root, 'Cargo.toml'));

if (hasPackageJson) {
  // Check if any test files exist before running vitest. A scaffold repo ships
  // zero tests; the adopting project adds them. Exit 1 from "no test files" is
  // not a failure — it's a SKIP.
  const testFiles = readdirSync(root, { recursive: true })
    .filter(f => /\.(test|spec)\.(m|c)?[jt]sx?$/.test(f) && !f.includes('node_modules') && !f.includes('.git'));
  if (testFiles.length > 0) {
    runStep('Test suite (vitest)', 'npx vitest run');
  } else {
    console.log('\n── Test suite (vitest) ──');
    console.log('SKIP: no test files found (*.test.* / *.spec.*)');
    console.log('       The scaffold ships zero tests. Adopting projects add them.');
    console.log('       See docs/sdd/sdd.md for the test-header format.');
  }
} else if (hasRequirementsTxt) {
  runStep('Test suite (pytest)', 'python -m pytest -q');
} else if (hasGoMod) {
  runStep('Test suite (go test)', 'go test ./...');
} else if (hasCargoToml) {
  runStep('Test suite (cargo test)', 'cargo test');
} else {
  console.log('\n── Test suite ──');
  console.log('SKIP: no recognized project manifest');
  console.log('       Expected: package.json, requirements.txt, go.mod, or Cargo.toml');
}

// Step 2: Docs check
runStep('Docs sync check', 'node .trellis/scripts/docs-sync.mjs --check', false);

// Step 3: Migration safety
if (existsSync(join(root, 'supabase', 'migrations'))) {
  runStep('Migration safety', 'node .trellis/scripts/check-migration-safety.mjs', false);
}

// Step 4: Ponytail format check (always advisory)
runStep('Ponytail marker format', 'node .trellis/scripts/check-ponytail.mjs', false);

// Step 5: Mutation testing (language-specific)
const strykerConfig = join(root, 'stryker.config.json');
const mutmutConfig = join(root, 'mutmut.ini');

if (existsSync(strykerConfig)) {
  runStep('Mutation testing (StrykerJS)', 'npx stryker run', false);
} else if (existsSync(mutmutConfig)) {
  runStep('Mutation testing (mutmut)', 'mutmut run', false);
} else if (hasGoMod) {
  console.log('\n── Mutation testing ──');
  console.log('INFO: Go mutation testing via go-mutesting (install separately)');
  console.log('      See .trellis/templates/go/README.md');
} else if (hasCargoToml) {
  console.log('\n── Mutation testing ──');
  console.log('INFO: Rust mutation testing via cargo-mutants (install separately)');
  console.log('      See .trellis/templates/rust/README.md');
} else {
  console.log('\n── Mutation testing ──');
  console.log('SKIP: no mutation testing config found');
  console.log('       JS/TS: .trellis/templates/js-ts/stryker.config.json');
  console.log('       Python: .trellis/templates/python/mutmut.ini');
  console.log('       Go: go-mutesting | Rust: cargo-mutants');
}

// Step 6: Golden tests
const goldenDir = join(root, '.trellis', 'tests', 'golden');
if (existsSync(goldenDir)) {
  // Check if directory has any test files
  const hasTests = readdirSync(goldenDir, { recursive: true }).some(f => /\.(test|spec)\.(m|c)?[jt]s$/.test(f));
  if (hasTests) {
    runStep('Golden tests', 'npx vitest run .trellis/tests/golden', false);
  } else {
    console.log('\n── Golden tests ──');
    console.log('SKIP: .trellis/tests/golden/ exists but contains no test files');
    console.log('       Golden tests are per-spec locked suites. See docs/sdd/sdd.md');
  }
} else {
  console.log('\n── Golden tests ──');
  console.log('SKIP: no .trellis/tests/golden/ directory');
  console.log('       Golden tests are per-spec locked suites. See docs/sdd/sdd.md');
}

// Summary
console.log('\n═══════════════════════════════════════════');
if (failures === 0) {
  console.log('  ALL REQUIRED EVALS PASSED');
} else {
  console.error(`  ${failures} REQUIRED EVAL(S) FAILED`);
}
console.log('═══════════════════════════════════════════');
process.exit(failures > 0 ? 1 : 0);
