#!/usr/bin/env node
/**
 * services.mjs — Manage Trellis's optional Docker services.
 *
 * Usage:
 *   node scripts/services.mjs start [phoenix|all]        # Boot services
 *   node scripts/services.mjs stop  [phoenix|all]        # Stop services
 *   node scripts/services.mjs status                     # Check running services
 *   node scripts/services.mjs ports                      # Show port assignments
 *
 * Services are optional Tier 3 features. Most projects don't need them.
 * This script gracefully skips if Docker is not installed or not running.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Mem0 is NOT managed here: it self-hosts from its own multi-service stack
// (pip install mem0ai for in-process, or mem0's official `cd server && make
// bootstrap`). See docs/self-hosted-services.md.
const SERVICES = {
  phoenix: {
    compose: 'docker-compose.phoenix.yml',
    name: 'Arize Phoenix (Agent Observability)',
    port: 6006,
    url: 'http://localhost:6006',
  },
};

function dockerAvailable() {
  try {
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getAction() {
  const action = process.argv[2] || 'status';
  const target = process.argv[3] || 'all';
  return { action, target };
}

function startService(key) {
  const svc = SERVICES[key];
  if (!svc) {
    console.error(`Unknown service: ${key}`);
    return false;
  }
  const composePath = join(root, svc.compose);
  if (!existsSync(composePath)) {
    console.log(`SKIP: ${svc.compose} not found`);
    return false;
  }
  try {
    execSync(`docker compose -f ${svc.compose} up -d`, {
      cwd: root,
      stdio: 'pipe',
    });
    console.log(`STARTED: ${svc.name}`);
    console.log(`  URL: ${svc.url}`);
    console.log(`  Port: ${svc.port}`);
    return true;
  } catch (e) {
    console.error(`FAIL: could not start ${key} — ${e.message.split('\n')[0]}`);
    return false;
  }
}

function stopService(key) {
  const svc = SERVICES[key];
  if (!svc) {
    console.error(`Unknown service: ${key}`);
    return false;
  }
  const composePath = join(root, svc.compose);
  if (!existsSync(composePath)) {
    console.log(`SKIP: ${svc.compose} not found`);
    return false;
  }
  try {
    execSync(`docker compose -f ${svc.compose} down`, {
      cwd: root,
      stdio: 'pipe',
    });
    console.log(`STOPPED: ${svc.name}`);
    return true;
  } catch {
    console.log(`SKIP: ${key} not running or not installed`);
    return false;
  }
}

function statusService(key) {
  const svc = SERVICES[key];
  if (!svc) return;
  const composePath = join(root, svc.compose);
  if (!existsSync(composePath)) {
    console.log(`  ${key}: not configured (${svc.compose} not found)`);
    return;
  }
  try {
    const output = execSync(
      `docker compose -f ${svc.compose} ps --format json 2>/dev/null`,
      { cwd: root, stdio: 'pipe', encoding: 'utf-8' }
    ).trim();
    if (!output) {
      console.log(`  ${key}: stopped`);
      return;
    }
    const lines = output.split('\n').filter(Boolean);
    const running = lines.filter(l => {
      try { return JSON.parse(l).State === 'running'; } catch { return false; }
    }).length;
    console.log(`  ${key}: ${running > 0 ? 'RUNNING' : 'stopped'} (port ${svc.port})`);
  } catch {
    console.log(`  ${key}: stopped`);
  }
}

const { action, target } = getAction();

if (!dockerAvailable()) {
  console.log('SKIP: Docker is not installed or not running.');
  console.log('  Trellis works without Docker. Phoenix is optional.');
  console.log('  Install Docker: https://docs.docker.com/get-docker/');
  process.exit(0);
}

const keys = target === 'all' ? Object.keys(SERVICES) : [target];

switch (action) {
  case 'start':
    console.log('Starting services...\n');
    for (const k of keys) startService(k);
    console.log('\nDone. These are optional Tier 3 services.');
    break;

  case 'stop':
    console.log('Stopping services...\n');
    for (const k of keys) stopService(k);
    console.log('\nDone.');
    break;

  case 'ports':
    console.log('Port assignments:\n');
    for (const [k, svc] of Object.entries(SERVICES)) {
      console.log(`  ${k}: ${svc.port} (${svc.name})`);
    }
    break;

  case 'status':
  default:
    console.log('Service status:\n');
    for (const k of keys) statusService(k);
    console.log('\n  Ports: run "node scripts/services.mjs ports"');
    console.log('  Start: run "node scripts/services.mjs start all"');
    console.log('  Stop:  run "node scripts/services.mjs stop all"');
    break;
}
