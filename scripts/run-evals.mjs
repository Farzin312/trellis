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
runStep('Test suite (vitest)', 'npx vitest run');

// Step 2: Docs check
runStep('Docs sync check', 'node scripts/docs-sync.mjs --check', false);

// Step 3: Migration safety
if (existsSync(join(root, 'supabase', 'migrations'))) {
  runStep('Migration safety', 'node scripts/check-migration-safety.mjs', false);
}

// Step 4: Ponytail format check (always advisory)
runStep('Ponytail marker format', 'node scripts/check-ponytail.mjs', false);

// Step 5: Mutation testing (optional, slow — skip if not configured)
const strykerConfig = join(root, 'stryker.config.json');
if (existsSync(strykerConfig)) {
  runStep('Mutation testing (stryker)', 'npx stryker run', false);
} else {
  console.log('\n── Mutation testing ──');
  console.log('SKIP: no stryker.config.json found');
  console.log('       Create one to enable mutation testing: https://stryker-mutator.io/docs/');
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
