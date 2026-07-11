import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const source = join(root, '.trellis', 'scripts', 'services.mjs');

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'trellis-services-'));
  mkdirSync(join(cwd, '.trellis', 'scripts'), { recursive: true });
  mkdirSync(join(cwd, '.trellis', 'services'), { recursive: true });
  copyFileSync(source, join(cwd, '.trellis', 'scripts', 'services.mjs'));
  writeFileSync(join(cwd, '.trellis', 'services', 'docker-compose.phoenix.yml'), 'services: {}\n');
  return cwd;
}

function run(cwd, args, env = {}) {
  return spawnSync(process.execPath, [join(cwd, '.trellis', 'scripts', 'services.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('unknown or missing actions and targets are usage errors', () => {
  const cwd = fixture();
  try {
    for (const args of [[], ['launch'], ['start', 'phoenix;touch-proof']]) {
      const result = run(cwd, args, { PATH: '' });
      assert.equal(result.status, 2, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, /Usage:/);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('ports is available without Docker while requested starts fail', () => {
  const cwd = fixture();
  try {
    const ports = run(cwd, ['ports'], { PATH: '' });
    assert.equal(ports.status, 0, ports.stdout + ports.stderr);
    assert.match(ports.stdout, /phoenix: 6006/);

    const start = run(cwd, ['start'], { PATH: '' });
    assert.equal(start.status, 1, start.stdout + start.stderr);
    assert.match(start.stderr, /FAIL: Docker is not installed or not running/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Docker compose failures propagate and use argument-array execution', () => {
  const cwd = fixture();
  try {
    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const docker = join(bin, 'docker');
    writeFileSync(docker, `#!${process.execPath}\nif (process.argv[2] === 'info') process.exit(0);\nconsole.error(process.argv.slice(2).join('|'));\nprocess.exit(9);\n`);
    chmodSync(docker, 0o755);

    const result = run(cwd, ['start', 'phoenix'], { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /FAIL: could not start phoenix/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
