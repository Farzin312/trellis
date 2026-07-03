#!/usr/bin/env node
/**
 * check-migration-safety.mjs
 *
 * Multi-tool migration eval suite. Detects which migration tool(s) a project
 * uses via config markers + directory patterns, then runs the appropriate
 * checks for each detected tool.
 *
 * Checks (where applicable to the detected tool):
 *   1. Unique version numbers (no duplicates)
 *   2. RLS enabled on new tables (SQL-based tools only)
 *   3. FK delete rules (warns on CASCADE without justification)
 *
 * Supported: 15 tools. See scripts/migration-adapters.json for the full list
 * and detection rules. Run --list-adapters to see all.
 *
 * Usage:
 *   node scripts/check-migration-safety.mjs
 *   node scripts/check-migration-safety.mjs --list-adapters
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const adaptersFile = join(__dirname, 'migration-adapters.json');
const args = process.argv.slice(2);

// ── Load adapters ──────────────────────────────────────────────────────

if (!existsSync(adaptersFile)) {
  console.error('FAIL: migration-adapters.json not found');
  process.exit(1);
}
const { adapters, defaults } = JSON.parse(readFileSync(adaptersFile, 'utf8'));

if (args.includes('--list-adapters')) {
  console.log('Supported migration tools:\n');
  console.log('  Tool'.padEnd(22) + 'Display'.padEnd(26) + 'Up/Down'.padEnd(10) + 'Status');
  console.log('  ' + '─'.repeat(70));
  for (const [key, adapter] of Object.entries(adapters)) {
    const upDown = adapter.supportsUpDown === true ? 'yes' :
                   adapter.supportsUpDown === 'partial' ? 'partial' : 'no';
    console.log(
      `  ${key.padEnd(22)}${adapter.displayName.padEnd(26)}${upDown.padEnd(10)}${adapter.status}`
    );
  }
  console.log('\n  RLS checkable: ' + Object.entries(adapters).filter(([,a]) => a.rlsCheckable).map(([k]) => k).join(', '));
  process.exit(0);
}

// ── Detection ──────────────────────────────────────────────────────────

function detectMigrationTools() {
  const detected = [];
  for (const [key, adapter] of Object.entries(adapters)) {
    const dirs = adapter.detect.dirs || [];
    const hasConfigMarker = (adapter.detect.configMarkers || []).some(m =>
      existsSync(join(root, m))
    );

    for (const dir of dirs) {
      const fullPath = join(root, dir);
      if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) continue;

      const files = collectMigrationFiles(fullPath, adapter.detect.filePattern);
      if (files.length > 0) {
        detected.push({
          key,
          adapter,
          dir: fullPath,
          files,
          detectedVia: hasConfigMarker ? 'config marker + directory' : 'directory pattern'
        });
        break; // one detection per tool
      }
    }
  }
  return detected;
}

function collectMigrationFiles(dir, filePattern) {
  const results = [];
  const allItems = readdirSync(dir, { withFileTypes: true });

  if (filePattern.includes('/')) {
    // Nested pattern (e.g., Prisma: */migration.sql)
    const [_, fileName] = filePattern.split('/');
    for (const item of allItems) {
      if (item.isDirectory()) {
        const targetFile = join(dir, item.name, fileName);
        if (existsSync(targetFile)) results.push(targetFile);
      }
    }
  } else {
    // Flat pattern (e.g., *.sql, *.py, V*__*.sql)
    const ext = '.' + filePattern.split('.').pop();
    const prefix = filePattern.replace(/\*.*/g, ''); // everything before first *
    for (const item of allItems) {
      if (!item.isFile()) continue;
      const matches = (prefix && item.name.startsWith(prefix)) ||
                      (!prefix && item.name.endsWith(ext));
      if (matches) results.push(join(dir, item.name));
    }
  }
  return results.sort();
}

const detectedTools = detectMigrationTools();

if (detectedTools.length === 0) {
  console.log('SKIP: no migration tool detected');
  console.log('      Checked for: ' + Object.values(adapters).map(a => a.detect.dirs?.[0]).filter(Boolean).join(', '));
  console.log(`\n      ${defaults.message}`);
  console.log('      Run: node scripts/check-migration-safety.mjs --list-adapters');
  process.exit(0);
}

// ── Run checks for each detected tool ──────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;

for (const tool of detectedTools) {
  console.log(`\n${tool.adapter.displayName} (${tool.key})`);
  console.log(`  Detected via: ${tool.detectedVia}`);
  console.log(`  Directory: ${tool.dir.replace(root, '.')}`);
  console.log(`  Files: ${tool.files.length}`);
  if (tool.adapter.status === 'limited') {
    console.log(`  Note: ${tool.adapter.note}`);
  }

  let errors = 0;
  let warnings = 0;
  const versionPattern = new RegExp(tool.adapter.versionPattern);

  // Check 1: Unique version numbers
  const versions = {};
  for (const file of tool.files) {
    const filename = file.split('/').pop();
    const match = filename.match(versionPattern);
    if (match) {
      const version = match[1];
      if (versions[version]) {
        console.error(`  FAIL: duplicate version ${version} (${versions[version].split('/').pop()} and ${filename})`);
        errors++;
      }
      versions[version] = file;
    }
  }
  console.log(`  [1] Unique versions: ${errors === 0 ? 'PASS' : `${errors} duplicates`} (${Object.keys(versions).length} versions)`);

  // Check 2: RLS on new tables
  if (tool.adapter.rlsCheckable) {
    for (const file of tool.files) {
      const content = readFileSync(file, 'utf8');
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
      let match;
      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        const rlsRegex = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          'i'
        );
        if (!rlsRegex.test(content)) {
          // Special case: node-pg-migrate uses pgm.enableRls()
          const pgmRegex = new RegExp(`pgm\\.enableRls\\s*\\(\\s*['\"]${tableName}['\"]`, 'i');
          if (!pgmRegex.test(content)) {
            console.warn(`  WARN: ${file.split('/').pop()} creates ${tableName} without RLS`);
            warnings++;
          }
        }
      }
    }
    console.log(`  [2] RLS on new tables: ${warnings === 0 ? 'PASS' : `${warnings} warnings`}`);
  } else {
    console.log(`  [2] RLS: SKIP (${tool.adapter.rlsSyntax})`);
  }

  // Check 3: FK CASCADE warnings
  let cascadeWarnings = 0;
  for (const file of tool.files) {
    const content = readFileSync(file, 'utf8');
    if (/ON\s+DELETE\s+CASCADE/gi.test(content) && !content.includes('-- trellis: allow-cascade')) {
      console.warn(`  WARN: ${file.split('/').pop()} uses ON DELETE CASCADE`);
      cascadeWarnings++;
      warnings++;
    }
  }
  console.log(`  [3] FK CASCADE: ${cascadeWarnings === 0 ? 'PASS' : `${cascadeWarnings} warnings`}`);

  totalErrors += errors;
  totalWarnings += warnings;
}

// Summary
console.log('\n' + '═'.repeat(60));
if (totalErrors === 0) {
  console.log(`PASS: ${detectedTools.length} tool(s) checked, ${detectedTools.flatMap(t => t.files).length} files total`);
  if (totalWarnings > 0) console.log(`      ${totalWarnings} warnings (non-blocking)`);
  process.exit(0);
} else {
  console.error(`FAIL: ${totalErrors} errors, ${totalWarnings} warnings`);
  process.exit(1);
}
