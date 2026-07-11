#!/usr/bin/env node
/** Inspect and atomically manage Trellis optional-integration configuration. */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ConfigError,
  INTEGRATIONS,
  readProjectConfig,
  writeProjectConfig,
} from './config-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [command, integration, ...rest] = process.argv.slice(2);

function usage() {
  console.error('Usage: config.mjs show | enable <graphify|bounds> | disable <graphify|bounds>');
  process.exit(2);
}

if (rest.length || !['show', 'enable', 'disable'].includes(command)) usage();
if (command === 'show' && integration !== undefined) usage();
if (command !== 'show' && !INTEGRATIONS.includes(integration)) usage();

try {
  const config = readProjectConfig(root);
  if (command === 'show') {
    process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
    process.exit(0);
  }

  const enabled = new Set(config.enabled_integrations);
  if (command === 'enable') enabled.add(integration);
  else enabled.delete(integration);
  const next = {
    ...config,
    enabled_integrations: INTEGRATIONS.filter((name) => enabled.has(name)),
  };
  writeProjectConfig(root, next);
  console.log(`PASS: integration=${integration} state=${command === 'enable' ? 'enabled' : 'disabled'}`);
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`FAIL: invalid configuration: ${error.message}`);
  } else {
    console.error(`FAIL: could not update configuration: ${error.message}`);
  }
  process.exit(1);
}
