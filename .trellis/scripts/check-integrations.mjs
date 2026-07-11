#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configPath = join(root, '.trellis', 'config.json');
const supported = new Set(['graphify', 'bounds', 'phoenix']);
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

let enabled = [];
if (existsSync(configPath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (!Array.isArray(config.enabled_integrations)
      || config.enabled_integrations.some((name) => typeof name !== 'string' || !supported.has(name))) {
      throw new Error('enabled_integrations must contain only graphify, bounds, or phoenix');
    }
    enabled = [...new Set(config.enabled_integrations)];
  } catch (error) {
    console.error(`FAIL integration=config reason=invalid-config next=${JSON.stringify(error.message)}`);
    process.exit(1);
  }
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
        const commit = graph.gitCommitHash || graph.commitHash || graph.meta?.gitCommitHash;
        if (typeof commit !== 'string' || !/^[a-f0-9]{7,64}$/i.test(commit)) {
          fail('graphify', 'missing-commit-metadata', 'rebuild the graph with the configured Graphify version');
        } else {
          const stale = run('git', ['rev-list', `${commit}..HEAD`, '--count']);
          const count = Number.parseInt(stale.stdout?.trim(), 10);
          if (stale.status !== 0 || !Number.isInteger(count)) {
            fail('graphify', 'unverifiable-commit', 'rebuild the graph from the current checkout');
          } else if (count > 0) {
            fail('graphify', `stale-${count}-commits`, 'run graphify update .');
          } else {
            console.log('PASS integration=graphify coverage=graph-present-and-current');
          }
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
        const validation = run('bounds', ['validate', '--mode', 'full', '--fail-on-unowned']);
        if (validation.status !== 0) fail('bounds', 'validation-failed', 'run bounds validate -H and resolve every error');
        else console.log(`PASS integration=bounds coverage=${mapped}-of-${total}`);
      }
    }
  }
}

process.exit(failures > 0 ? 1 : 0);
