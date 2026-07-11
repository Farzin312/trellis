#!/usr/bin/env node
/** Manage explicitly requested optional local services. */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const services = {
  phoenix: {
    compose: join(root, '.trellis', 'services', 'docker-compose.phoenix.yml'),
    label: 'Arize Phoenix',
    port: 6006,
  },
};

function usage() {
  console.error('Usage: services.mjs start|stop|status|ports [phoenix|all]');
  process.exit(2);
}

const [action, target = 'all', ...rest] = process.argv.slice(2);
if (rest.length || !['start', 'stop', 'status', 'ports'].includes(action)
  || !['all', ...Object.keys(services)].includes(target)) usage();

const keys = target === 'all' ? Object.keys(services) : [target];
if (action === 'ports') {
  for (const key of keys) console.log(`${key}: ${services[key].port} (${services[key].label})`);
  process.exit(0);
}

function docker(args, options = {}) {
  return spawnSync('docker', args, { cwd: root, encoding: 'utf8', ...options });
}

const info = docker(['info']);
if (info.error || info.status !== 0) {
  if (action === 'status') {
    console.log('SKIP: Docker is unavailable; optional services were not inspected');
    process.exit(0);
  }
  console.error('FAIL: Docker is not installed or not running');
  process.exit(1);
}

let failures = 0;
for (const key of keys) {
  const service = services[key];
  if (!existsSync(service.compose)) {
    console.error(`FAIL: ${key} compose file is missing`);
    failures++;
    continue;
  }

  if (action === 'status') {
    const result = docker(['compose', '-f', service.compose, 'ps', '--format', 'json']);
    if (result.status !== 0) {
      console.error(`FAIL: could not inspect ${key}`);
      failures++;
    } else {
      const running = result.stdout.split('\n').filter(Boolean).some((line) => {
        try { return JSON.parse(line).State === 'running'; } catch { return false; }
      });
      console.log(`${key}: ${running ? 'running' : 'stopped'}`);
    }
    continue;
  }

  const composeArgs = ['compose', '-f', service.compose, action === 'start' ? 'up' : 'down'];
  if (action === 'start') composeArgs.push('-d');
  const result = docker(composeArgs);
  if (result.error || result.status !== 0) {
    console.error(`FAIL: could not ${action} ${key}`);
    failures++;
  } else {
    console.log(`PASS: ${key} ${action === 'start' ? 'started' : 'stopped'}`);
  }
}

process.exit(failures > 0 ? 1 : 0);
