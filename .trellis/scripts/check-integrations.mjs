#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigError, readProjectConfig } from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let failures = 0;

function fail(integration, reason, next) {
  failures++;
  console.error(`FAIL integration=${integration} reason=${reason} next=${JSON.stringify(next)}`);
}

function skip(integration) {
  console.log(`SKIP integration=${integration} reason=not-configured`);
}

function run(command, args) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8' });
}

let enabled;
try {
  enabled = readProjectConfig(root).enabled_integrations;
} catch (error) {
  const detail = error instanceof ConfigError ? error.message : `read failed: ${error.message}`;
  console.error(`FAIL integration=config reason=invalid-config next=${JSON.stringify(detail)}`);
  process.exit(1);
}

if (!enabled.includes('graphify')) {
  skip('graphify');
} else {
  const version = run('graphify', ['--version']);
  if (version.error?.code === 'ENOENT') {
    fail('graphify', 'missing-command', 'install the configured Graphify version');
  } else if (version.status !== 0) {
    fail('graphify', 'command-failed', 'repair the Graphify installation');
  } else {
    const graphPath = join(root, 'graphify-out', 'graph.json');
    if (!existsSync(graphPath)) {
      fail('graphify', 'missing-artifact', 'run graphify .');
    } else {
      let graph;
      try {
        graph = JSON.parse(readFileSync(graphPath, 'utf8'));
      } catch {
        fail('graphify', 'corrupt-artifact', 'delete graphify-out and rebuild the graph');
      }
      if (graph) {
        const links = graph.links || graph.edges;
        if (!Array.isArray(graph.nodes) || !Array.isArray(links)) {
          fail('graphify', 'invalid-artifact-schema', 'run trellis graph to rebuild graphify-out/graph.json');
        } else if (graph.nodes.length === 0) {
          fail('graphify', 'zero-coverage', 'run trellis graph against a path containing supported source');
        } else if (existsSync(join(root, 'graphify-out', 'needs_update'))) {
          fail('graphify', 'pending-semantic-update', 'run the Graphify semantic update workflow for changed non-code content');
        } else {
          console.log(`PASS integration=graphify artifact=valid nodes=${graph.nodes.length}`);
        }
      }
    }
  }
}

if (!enabled.includes('bounds')) {
  skip('bounds');
} else {
  const version = run('bounds', ['--version']);
  if (version.error?.code === 'ENOENT') {
    fail('bounds', 'missing-command', 'install the configured Bounds version');
  } else if (version.status !== 0) {
    fail('bounds', 'command-failed', 'repair the Bounds installation');
  } else if (!existsSync(join(root, '.bounds', 'root.yaml'))) {
    fail('bounds', 'missing-config', 'run bounds init and configure subsystem ownership');
  } else {
    const coverageResult = run('bounds', ['coverage']);
    let coverage;
    try {
      coverage = JSON.parse(coverageResult.stdout || '');
    } catch {
      fail('bounds', 'corrupt-coverage-output', 'run bounds coverage and repair its configuration');
    }
    if (coverage) {
      const total = coverage.supported?.total;
      const mapped = coverage.supported?.mapped;
      if (coverageResult.status !== 0 || !Number.isInteger(total) || !Number.isInteger(mapped)) {
        fail('bounds', 'invalid-coverage-output', 'run bounds coverage and repair its configuration');
      } else if (total === 0 || mapped === 0) {
        fail('bounds', 'zero-coverage', 'assign supported source files to Bounds subsystems');
      } else if (mapped < total) {
        fail('bounds', `partial-coverage-${mapped}-of-${total}`, 'assign every supported source file');
      } else {
        const validation = run('bounds', ['preflight', '--fail-on-unowned']);
        if (validation.status !== 0) fail('bounds', 'validation-failed', 'run bounds validate -H and resolve every error');
        else console.log(`PASS integration=bounds coverage=${mapped}-of-${total}`);
      }
    }
  }
}

process.exit(failures > 0 ? 1 : 0);
