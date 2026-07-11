import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
  copyFileSync(
    join(root, '.trellis', 'services', 'docker-compose.phoenix.yml'),
    join(cwd, '.trellis', 'services', 'docker-compose.phoenix.yml'),
  );
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

test('ports is available without Docker while requested operations fail', () => {
  const cwd = fixture();
  try {
    const ports = run(cwd, ['ports'], { PATH: '' });
    assert.equal(ports.status, 0, ports.stdout + ports.stderr);
    assert.match(ports.stdout, /phoenix: 6006/);
    assert.match(ports.stdout, /4317/);

    for (const action of ['start', 'stop', 'status']) {
      const result = run(cwd, [action], { PATH: '' });
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /FAIL: Docker is not installed or not running/);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('status accepts Docker Compose JSON arrays and reports a running service', () => {
  const cwd = fixture();
  try {
    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const docker = join(bin, 'docker');
    writeFileSync(docker, `#!${process.execPath}
if (process.argv[2] === 'info') process.exit(0);
if (process.argv.includes('ps')) {
  console.log(JSON.stringify([{ Service: 'phoenix', State: 'running' }]));
  process.exit(0);
}
process.exit(9);
`);
    chmodSync(docker, 0o755);

    const result = run(cwd, ['status', 'phoenix'], { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /phoenix: running/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('malformed Docker status output fails instead of reporting stopped', () => {
  const cwd = fixture();
  try {
    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const docker = join(bin, 'docker');
    writeFileSync(docker, `#!${process.execPath}
if (process.argv[2] === 'info') process.exit(0);
console.log('{broken');
process.exit(0);
`);
    chmodSync(docker, 0o755);

    const result = run(cwd, ['status', 'phoenix'], { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /invalid status output/i);
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

test('service operations reject modified and symlinked compose payloads before Docker', () => {
  for (const mode of ['modified', 'symlinked']) {
    const cwd = fixture();
    const outside = mkdtempSync(join(tmpdir(), 'trellis-compose-outside-'));
    try {
      const compose = join(cwd, '.trellis', 'services', 'docker-compose.phoenix.yml');
      if (mode === 'modified') {
        writeFileSync(compose, 'services:\n  attacker:\n    image: unsafe\n');
      } else {
        rmSync(compose);
        const target = join(outside, 'compose.yml');
        writeFileSync(target, 'services: {}\n');
        symlinkSync(target, compose);
      }
      const result = run(cwd, ['start', 'phoenix'], { PATH: '' });
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /compose.*(?:differs|non-symlink)/i);
      assert.doesNotMatch(result.stderr, /Docker is not installed/i);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  }
});
