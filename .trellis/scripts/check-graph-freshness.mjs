#!/usr/bin/env node
/**
 * check-graph-freshness.mjs
 *
 * CI gate: verifies the Graphify knowledge graph is not stale.
 * If graphify-out/graph.json exists, checks that its gitCommitHash
 * matches HEAD or is within N commits.
 *
 * Usage: node .trellis/scripts/check-graph-freshness.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const graphFile = join(root, 'graphify-out', 'graph.json');

if (!existsSync(graphFile)) {
  console.log('SKIP: no graphify-out/graph.json (run `graphify .` to build the graph)');
  process.exit(0);
}

// Get current HEAD
let head;
try {
  head = execSync('git rev-parse HEAD', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  console.log('SKIP: not a git repo or git not available');
  process.exit(0);
}

// Try to read graph metadata
let graphCommit = null;
try {
  const graph = JSON.parse(readFileSync(graphFile, 'utf8'));
  graphCommit = graph.gitCommitHash || graph.commitHash || graph.meta?.gitCommitHash || null;
} catch {
  // If we can't parse the graph JSON, we can't check freshness
  console.log('SKIP: cannot parse graph.json metadata');
  process.exit(0);
}

if (!graphCommit) {
  console.log('SKIP: graph.json has no gitCommitHash field');
  process.exit(0);
}

// Check how many commits behind HEAD
let commitsBehind = 0;
try {
  const count = execSync(`git rev-list ${graphCommit}..HEAD --count`, {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  commitsBehind = parseInt(count, 10);
} catch {
  // graphCommit not in git history (rebased away?) — stale
  console.error('FAIL: graph.json references a commit not in git history');
  console.error('       Run: graphify .');
  process.exit(1);
}

const MAX_STALE_COMMITS = 10;

if (commitsBehind > MAX_STALE_COMMITS) {
  console.error(`FAIL: knowledge graph is ${commitsBehind} commits behind HEAD (max ${MAX_STALE_COMMITS})`);
  console.error('       Run: graphify .');
  process.exit(1);
} else {
  console.log(`PASS: knowledge graph is ${commitsBehind} commits behind HEAD`);
  process.exit(0);
}
