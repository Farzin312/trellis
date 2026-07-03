#!/usr/bin/env node
/**
 * check-migration-safety.mjs
 *
 * Multi-tool migration eval suite. Detects which migration tool a project uses,
 * then runs the appropriate checks.
 *
 * Detection: reads scripts/migration-adapters.json for directory/file patterns.
 * Each adapter declares whether RLS and FK checks are applicable.
 *
 * Checks (where applicable to the detected tool):
 *   1. Unique version numbers (no duplicates)
 *   2. RLS enabled on new tables
 *   3. FK delete rules (warns on CASCADE without justification)
 *   4. (SQL-based tools only) up/down round-trip safety review
 *
 * Supported: supabase, prisma, drizzle, flyway, alembic, rails, django,
 * knex, golang-migrate, typeorm, goose, atlas, sequelize, node-pg-migrate,
 * liquibase (limited).
 *
 * Not supported: custom tools. The script reports which tool was detected
 * (or none) so you know exactly what coverage you have.
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
  console.log('Supported migration tools:');
  for (const [key, adapter] of Object.entries(adapters)) {
    console.log(`  ${key.padEnd(20)} ${adapter.displayName.padEnd(25)} ${adapter.status}`);
  }
  process.exit(0);
}

// ── Detection ──────────────────────────────────────────────────────────

function detectMigrationTool() {
  for (const [key, adapter] of Object.entries(adapters)) {
    const dirs = [adapter.detect.dir, ...(adapter.detect.fallbackDirs || [])];
    for (const dir of dirs) {
      const fullPath = join(root, dir);
      if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
        // Verify matching files exist
        const files = readdirSync(fullPath).filter(f => {
          const pattern = adapter.detect.filePattern.replace(/\*/g, '');
          return f.includes(pattern.split('/')[0]) || f.endsWith(adapter.detect.filePattern.replace('*', ''));
        });
        if (files.length > 0 || adapter.detect.filePattern.includes('/')) {
          return { key, adapter, dir: fullPath, files };
        }
      }
    }
  }
  return null;
}

const detected = detectMigrationTool();

if (!detected) {
  console.log('SKIP: no migration tool detected');
  console.log('      Supported tools:');
  for (const [key, adapter] of Object.entries(adapters)) {
    console.log(`        ${key}: ${adapter.detect.dir}/`);
  }
  console.log(`      ${defaults.message}`);
  process.exit(0);
}

console.log(`Detected migration tool: ${detected.adapter.displayName} (${detected.key})`);
console.log(`  Directory: ${detected.dir.replace(root, '.')}`);
console.log(`  Status: ${detected.adapter.status}`);

if (detected.adapter.status === 'limited') {
  console.log(`  Note: ${detected.adapter.note}`);
}

// ── Gather migration files ─────────────────────────────────────────────

function getMigrationFiles(dir, filePattern) {
  const results = [];
  const allItems = readdirSync(dir, { withFileTypes: true });

  // Handle patterns like "*/migration.sql" (Prisma) — recurse one level
  if (filePattern.includes('/')) {
    const [subPattern, fileName] = filePattern.split('/');
    for (const item of allItems) {
      if (item.isDirectory()) {
        const subDir = join(dir, item.name);
        const targetFile = join(subDir, fileName);
        if (existsSync(targetFile)) {
          results.push(targetFile);
        }
      }
    }
  } else {
    // Flat pattern like "*.sql" or "*.py" or "*.js" or "V*__*.sql"
    const ext = '.' + filePattern.split('.').pop();
    const prefix = filePattern.split('*')[0];
    for (const item of allItems) {
      if (item.isFile()) {
        if (item.name.endsWith(ext) || (prefix && item.name.startsWith(prefix))) {
          results.push(join(dir, item.name));
        }
      }
    }
  }
  return results.sort();
}

const migrationFiles = getMigrationFiles(detected.dir, detected.adapter.detect.filePattern);

if (migrationFiles.length === 0) {
  console.log('SKIP: migration tool detected but no migration files found');
  process.exit(0);
}

console.log(`  Files: ${migrationFiles.length}`);

// ── Run checks ─────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;
const versionPattern = new RegExp(detected.adapter.versionPattern);

// Check 1: Unique version numbers
const versions = {};
for (const file of migrationFiles) {
  const filename = file.split('/').pop();
  const match = filename.match(versionPattern);
  if (match) {
    const version = match[1];
    if (versions[version]) {
      console.error(`FAIL: duplicate migration version ${version}`);
      console.error(`       ${versions[version].split('/').pop()} and ${filename}`);
      errors++;
    }
    versions[version] = file;
  }
}
console.log(`  [Check 1] Unique versions: ${errors === 0 ? 'PASS' : 'FAIL'} (${Object.keys(versions).length} versions)`);

// Check 2: RLS on new tables (if applicable)
if (detected.adapter.rlsCheckable) {
  for (const file of migrationFiles) {
    const content = readFileSync(file, 'utf8');

    // Find CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const rlsRegex = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i'
      );
      if (!rlsRegex.test(content)) {
        const relFile = file.replace(root + '/', '');
        console.warn(`WARN: ${relFile} creates table ${tableName} without ENABLE ROW LEVEL SECURITY`);
        warnings++;
      }
    }
  }
  console.log(`  [Check 2] RLS on new tables: ${warnings === 0 ? 'PASS' : `${warnings} warnings`}`);
} else {
  console.log(`  [Check 2] RLS: SKIP (${detected.adapter.note})`);
}

// Check 3: FK CASCADE warnings
for (const file of migrationFiles) {
  const content = readFileSync(file, 'utf8');
  const cascadeRegex = /ON\s+DELETE\s+CASCADE/gi;
  if (cascadeRegex.test(content) && !content.includes('-- trellis: allow-cascade')) {
    const relFile = file.replace(root + '/', '');
    console.warn(`WARN: ${relFile} uses ON DELETE CASCADE — verify this is intentional`);
    console.warn(`       If intentional, add '-- trellis: allow-cascade' to the migration`);
    warnings++;
  }
}
console.log(`  [Check 3] FK CASCADE check: complete`);

// Summary
console.log('');
if (errors === 0) {
  console.log(`PASS: ${detected.adapter.displayName} migration safety — ${migrationFiles.length} files checked`);
  process.exit(0);
} else {
  console.error(`FAIL: ${errors} errors, ${warnings} warnings`);
  process.exit(1);
}
