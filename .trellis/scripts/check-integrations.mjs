#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigError, readProjectConfig } from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_GRAPH_BYTES = 512 * 1024 * 1024;
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
    fail('graphify', 'missing-command', 'install Graphify 0.9.10 or another reviewed compatible version');
  } else if (version.status !== 0) {
    fail('graphify', 'command-failed', 'repair the Graphify installation');
  } else {
    const graphDirectory = join(root, 'graphify-out');
    const graphPath = join(root, 'graphify-out', 'graph.json');
    if (existsSync(graphDirectory) && lstatSync(graphDirectory).isSymbolicLink()) {
      fail('graphify', 'unsafe-artifact-path', 'replace graphify-out with a project-local regular directory and rebuild');
    } else if (!existsSync(graphPath)) {
      fail('graphify', 'missing-artifact', 'run trellis graph');
    } else if (lstatSync(graphPath).isSymbolicLink() || !lstatSync(graphPath).isFile()) {
      fail('graphify', 'unsafe-artifact-path', 'replace graphify-out/graph.json with a project-local regular file and rebuild');
    } else if (lstatSync(graphPath).size > MAX_GRAPH_BYTES) {
      fail('graphify', 'artifact-too-large', 'review the graph and rebuild an artifact below the 512 MiB safety limit');
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
    fail('bounds', 'missing-command', 'install the tested Bounds commit or another reviewed compatible version');
  } else if (version.status !== 0) {
    fail('bounds', 'command-failed', 'repair the Bounds installation');
  } else if (existsSync(join(root, '.bounds')) && lstatSync(join(root, '.bounds')).isSymbolicLink()) {
    fail('bounds', 'unsafe-config-path', 'replace .bounds with a project-local regular directory');
  } else if (!existsSync(join(root, '.bounds', 'root.yaml'))) {
    fail('bounds', 'missing-config', 'run bounds init --root and configure subsystem ownership');
  } else if (lstatSync(join(root, '.bounds', 'root.yaml')).isSymbolicLink()
    || !lstatSync(join(root, '.bounds', 'root.yaml')).isFile()) {
    fail('bounds', 'unsafe-config-path', 'replace .bounds/root.yaml with a project-local regular file');
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
        if (validation.status !== 0) fail('bounds', 'validation-failed', 'run bounds preflight --fail-on-unowned -H and resolve every error');
        else console.log(`PASS integration=bounds coverage=${mapped}-of-${total}`);
      }
    }
  }
}

process.exit(failures > 0 ? 1 : 0);
