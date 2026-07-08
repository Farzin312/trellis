#!/usr/bin/env node
/**
 * check-doc-breadcrumbs.mjs
 *
 * CI gate: verifies every doc has a parent breadcrumb and all doc links resolve.
 * Wrapper around docs-sync.mjs --check.
 *
 * Usage: node .trellis/scripts/check-doc-breadcrumbs.mjs
 */

import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  execFileSync('node', [join(__dirname, 'docs-sync.mjs'), '--check'], {
    stdio: 'inherit',
  });
} catch {
  process.exit(1);
}
