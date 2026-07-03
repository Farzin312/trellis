#!/usr/bin/env node
/**
 * check-ponytail.mjs
 *
 * Format-only check (NOT a build blocker). Validates that existing
 * # ponytail: markers include a ceiling and upgrade path.
 *
 * Ponytail is a DEFAULT POSTURE, not a hard gate. This script does NOT:
 *   - scan for complexity
 *   - block builds
 *   - second-guess the developer's decisions
 *
 * It only checks the FORMAT of deliberate simplification markers.
 *
 * Also validates # trellis: full-impl markers include a reason.
 *
 * Usage: node scripts/check-ponytail.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Only scan source directories (not node_modules, docs, etc.)
const scanDirs = ['app', 'lib', 'components', 'types', 'supabase', 'scripts'];
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.sql'];

let warnings = 0;
let checked = 0;

function walkDir(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, results);
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const ponytailRegex = /#\s*ponytail:\s*(.+)/gi;
const trellisRegex = /#\s*trellis:\s*full-impl\s*,\s*(.+)/gi;

for (const scanDir of scanDirs) {
  const dirPath = join(root, scanDir);
  if (!existsSync(dirPath)) continue;

  const files = walkDir(dirPath);
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const relFile = relative(root, file);
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      // Check ponytail markers
      let match;
      while ((match = ponytailRegex.exec(line)) !== null) {
        checked++;
        const marker = match[1].trim();
        // Valid format: "# ponytail: <ceiling>, upgrade: <path>"
        if (!marker.toLowerCase().includes('upgrade')) {
          warnings++;
          console.warn(`WARN: ${relFile}:${i + 1} — # ponytail: marker missing upgrade path`);
          console.warn(`       Found: ${line.trim()}`);
          console.warn(`       Expected: # ponytail: <ceiling>, upgrade: <path>`);
        }
      }

      // Check trellis full-impl markers
      while ((match = trellisRegex.exec(line)) !== null) {
        checked++;
        const reason = match[1].trim();
        if (!reason || reason.length < 5) {
          warnings++;
          console.warn(`WARN: ${relFile}:${i + 1} — # trellis: full-impl marker needs a reason`);
        }
      }
    });
  }
}

if (checked === 0) {
  console.log('PASS: no ponytail/trellis markers found (advisory check — nothing to validate)');
} else if (warnings === 0) {
  console.log(`PASS: ${checked} ponytail/trellis markers checked — all well-formed`);
} else {
  console.warn(`WARN: ${warnings}/${checked} markers need format fixes (non-blocking)`);
}

// Always exit 0 — this is advisory, not a gate
process.exit(0);
