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
 * Usage: node scripts/run-evals.mjs
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failures = 0;

function runStep(name, command, required = true) {
  console.log(`\n── ${name} ──`);
  try {
    execSync(command, { cwd: root, stdio: 'inherit' });
    console.log(`PASS: ${name}`);
  } catch (e) {
    if (required) {
      console.error(`FAIL: ${name}`);
      failures++;
    } else {
      console.warn(`WARN: ${name} (non-blocking)`);
    }
  }
}

// Step 1: Unit + integration tests
const hasPackageJson = existsSync(join(root, 'package.json'));
const hasRequirementsTxt = existsSync(join(root, 'requirements.txt'));
const hasGoMod = existsSync(join(root, 'go.mod'));
const hasCargoToml = existsSync(join(root, 'Cargo.toml'));

if (hasPackageJson) {
  runStep('Test suite (vitest)', 'npx vitest run');
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
runStep('Docs sync check', 'node scripts/docs-sync.mjs --check', false);

// Step 3: Migration safety
if (existsSync(join(root, 'supabase', 'migrations'))) {
  runStep('Migration safety', 'node scripts/check-migration-safety.mjs', false);
}

// Step 4: Ponytail format check (always advisory)
runStep('Ponytail marker format', 'node scripts/check-ponytail.mjs', false);

// Step 5: Mutation testing (language-specific)
const strykerConfig = join(root, 'stryker.config.json');
const mutmutConfig = join(root, 'mutmut.ini');

if (strykerConfig) {
  runStep('Mutation testing (StrykerJS)', 'npx stryker run', false);
} else if (mutmutConfig) {
  runStep('Mutation testing (mutmut)', 'mutmut run', false);
} else if (hasGoMod) {
  console.log('\n── Mutation testing ──');
  console.log('INFO: Go mutation testing via go-mutesting (install separately)');
  console.log('      See templates/go/README.md');
} else if (hasCargoToml) {
  console.log('\n── Mutation testing ──');
  console.log('INFO: Rust mutation testing via cargo-mutants (install separately)');
  console.log('      See templates/rust/README.md');
} else {
  console.log('\n── Mutation testing ──');
  console.log('SKIP: no mutation testing config found');
  console.log('       JS/TS: templates/js-ts/stryker.config.json');
  console.log('       Python: templates/python/mutmut.ini');
  console.log('       Go: go-mutesting | Rust: cargo-mutants');
}

// Step 6: Golden tests
const goldenDir = join(root, 'tests', 'golden');
if (existsSync(goldenDir)) {
  runStep('Golden tests', 'npx vitest run tests/golden', false);
} else {
  console.log('\n── Golden tests ──');
  console.log('SKIP: no tests/golden/ directory');
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
