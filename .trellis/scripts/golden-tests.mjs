#!/usr/bin/env node
/**
 * golden-tests.mjs
 *
 * Manages per-spec locked golden test suites. When a spec ships (verify.md
 * flips to COMPLETE), this script freezes the spec's tests into .trellis/tests/golden/.
 *
 * Usage:
 *   node .trellis/scripts/golden-tests.mjs freeze <NNN>     — freeze a spec's tests
 *   node .trellis/scripts/golden-tests.mjs list             — list frozen golden suites
 *   node .trellis/scripts/golden-tests.mjs verify           — run all golden suites
 */

import { readdirSync, existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const specsDir = join(root, '.specify', 'specs');
const goldenDir = join(root, '.trellis', 'tests', 'golden');
const command = process.argv[2] || 'list';

mkdirSync(goldenDir, { recursive: true });

switch (command) {
  case 'freeze': {
    const specId = process.argv[3];
    if (!specId) {
      console.error('Usage: golden-tests.mjs freeze <NNN>');
      process.exit(1);
    }

    // Find the spec directory
    const specDirs = existsSync(specsDir) ? readdirSync(specsDir) : [];
    const specDir = specDirs.find(d => d.startsWith(specId));
    if (!specDir) {
      console.error(`FAIL: spec ${specId} not found in ${specsDir}`);
      process.exit(1);
    }

    const fullSpecDir = join(specsDir, specDir);

    // Check verify.md is COMPLETE
    const verifyFile = join(fullSpecDir, 'verify.md');
    if (!existsSync(verifyFile)) {
      console.error(`FAIL: ${specDir}/verify.md not found. Cannot freeze an incomplete spec.`);
      process.exit(1);
    }
    const verifyContent = readFileSync(verifyFile, 'utf8');
    if (!verifyContent.includes('COMPLETE')) {
      console.error(`FAIL: ${specDir}/verify.md is not COMPLETE. Cannot freeze.`);
      process.exit(1);
    }

    // Copy any test files referenced in the spec directory
    const testFiles = readdirSync(fullSpecDir).filter(f =>
      f.includes('test') || f.endsWith('.test.ts') || f.endsWith('.test.tsx') ||
      f.endsWith('.test.js') || f.endsWith('.test.py') || f.endsWith('_test.go')
    );

    const goldenSpecDir = join(goldenDir, specDir);
    mkdirSync(goldenSpecDir, { recursive: true });

    if (testFiles.length === 0) {
      // Write a marker so the frozen suite is tracked
      writeFileSync(join(goldenSpecDir, '.frozen'), `Frozen from ${specDir} on ${new Date().toISOString()}\n`);
      console.log(`PASS: frozen ${specDir} (no test files found — marker written)`);
    } else {
      for (const testFile of testFiles) {
        copyFileSync(join(fullSpecDir, testFile), join(goldenSpecDir, testFile));
      }
      console.log(`PASS: frozen ${specDir} — ${testFiles.length} test file(s)`);
    }
    break;
  }

  case 'list': {
    if (!existsSync(goldenDir)) {
      console.log('No golden tests directory');
      break;
    }
    const suites = readdirSync(goldenDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    if (suites.length === 0) {
      console.log('No golden test suites frozen');
    } else {
      console.log('Frozen golden test suites:');
      for (const s of suites) console.log(`  ${s}`);
    }
    break;
  }

  case 'verify': {
    if (!existsSync(goldenDir)) {
      console.log('SKIP: no .trellis/tests/golden/ directory');
      process.exit(0);
    }
    const hasPackageJson = existsSync(join(root, 'package.json'));
    try {
      if (hasPackageJson) {
        execSync('npx vitest run .trellis/tests/golden', { cwd: root, stdio: 'inherit' });
      } else {
        console.log('SKIP: golden tests require vitest (JS/TS projects)');
      }
    } catch {
      console.error('FAIL: golden tests failed');
      process.exit(1);
    }
    break;
  }

  default:
    console.error('Usage: golden-tests.mjs [freeze <NNN> | list | verify]');
    process.exit(1);
}
