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
    ports: [6006, 4317],
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
  for (const key of keys) console.log(`${key}: ${services[key].ports.join(', ')} (${services[key].label})`);
  process.exit(0);
}

function docker(args, options = {}) {
  return spawnSync('docker', args, { cwd: root, encoding: 'utf8', ...options });
}

const info = docker(['info']);
if (info.error || info.status !== 0) {
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
      let rows = [];
      const output = result.stdout.trim();
      let malformed = false;
      try {
        const parsed = JSON.parse(output || '[]');
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        for (const line of output.split('\n').filter(Boolean)) {
          try { rows.push(JSON.parse(line)); } catch { malformed = true; }
        }
      }
      if (malformed || rows.some((row) => !row || typeof row !== 'object' || typeof row.State !== 'string')) {
        console.error(`FAIL: Docker returned invalid status output for ${key}`);
        failures++;
        continue;
      }
      const running = rows.some((row) => row.State === 'running');
      console.log(`${key}: ${running ? 'running' : 'stopped'}`);
    }
    continue;
  }

  const composeArgs = ['compose', '-f', service.compose, action === 'start' ? 'up' : 'down'];
  if (action === 'start') composeArgs.push('-d', '--wait', '--wait-timeout', '60');
  const result = docker(composeArgs);
  if (result.error || result.status !== 0) {
    console.error(`FAIL: could not ${action} ${key}`);
    failures++;
  } else {
    console.log(`PASS: ${key} ${action === 'start' ? 'started' : 'stopped'}`);
  }
}

process.exit(failures > 0 ? 1 : 0);
