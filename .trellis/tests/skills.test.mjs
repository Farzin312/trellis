import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const canonical = join(root, '.agents', 'skills');
const claude = join(root, '.claude', 'skills');

test('Agent Skills have one canonical source and one compatibility mirror', () => {
  assert.ok(existsSync(canonical));
  const names = readdirSync(canonical, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(names.length >= 18, `expected >=18 skills, found ${names.length}`);
  for (const name of names) {
    const source = readFileSync(join(canonical, name, 'SKILL.md'), 'utf8');
    const mirror = readFileSync(join(claude, name, 'SKILL.md'), 'utf8');
    assert.equal(mirror, source, name);
  }
});

test('legacy platform mirrors are absent', () => {
  for (const path of [
    '.codex/agents',
    '.codex/prompts',
    '.opencode/command',
    '.claude/commands',
  ]) assert.equal(existsSync(join(root, path)), false, path);
});

test('skill generation refuses a symlinked Claude mirror root', () => {
  const project = mkdtempSync(join(tmpdir(), 'trellis-skills-'));
  const outside = mkdtempSync(join(tmpdir(), 'trellis-skills-outside-'));
  try {
    mkdirSync(join(project, '.agents', 'skills', 'example'), { recursive: true });
    mkdirSync(join(project, '.claude'), { recursive: true });
    mkdirSync(join(project, '.trellis', 'scripts'), { recursive: true });
    writeFileSync(join(project, '.agents', 'skills', 'example', 'SKILL.md'), '---\nname: example\ndescription: Example.\n---\n');
    writeFileSync(join(outside, 'keep.txt'), 'outside\n');
    symlinkSync(outside, join(project, '.claude', 'skills'));
    cpSync(
      join(root, '.trellis', 'scripts', 'generate-skills.mjs'),
      join(project, '.trellis', 'scripts', 'generate-skills.mjs'),
    );

    const result = spawnSync(process.execPath, ['.trellis/scripts/generate-skills.mjs'], {
      cwd: project,
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /Claude skill mirror.*symbolic link/i);
    assert.deepEqual(readdirSync(outside), ['keep.txt']);
  } finally {
    rmSync(project, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('skill health rejects an unexpected Claude-only skill', () => {
  const project = mkdtempSync(join(tmpdir(), 'trellis-skill-health-'));
  try {
    for (const base of ['.agents/skills/example', '.claude/skills/example', '.claude/skills/extra', '.trellis/scripts']) {
      mkdirSync(join(project, base), { recursive: true });
    }
    const skill = '---\nname: example\ndescription: Example.\n---\n';
    writeFileSync(join(project, '.agents', 'skills', 'example', 'SKILL.md'), skill);
    writeFileSync(join(project, '.claude', 'skills', 'example', 'SKILL.md'), skill);
    writeFileSync(join(project, '.claude', 'skills', 'extra', 'SKILL.md'), 'user-only\n');
    writeFileSync(join(project, '.trellis', 'generated-skills.json'), JSON.stringify({
      schema_version: 1,
      files: ['.claude/skills/example'],
    }));
    cpSync(
      join(root, '.trellis', 'scripts', 'evolve-skills.mjs'),
      join(project, '.trellis', 'scripts', 'evolve-skills.mjs'),
    );

    const result = spawnSync(process.execPath, ['.trellis/scripts/evolve-skills.mjs'], {
      cwd: project,
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /unexpected Claude skill.*extra/i);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});

test('skill health accepts a valid large third-party skill with an efficiency warning', () => {
  const project = mkdtempSync(join(tmpdir(), 'trellis-third-party-skill-'));
  try {
    for (const base of ['.agents/skills/external', '.claude/skills/external', '.trellis/scripts']) {
      mkdirSync(join(project, base), { recursive: true });
    }
    const skill = `---\nname: external\ndescription: External integration used for architecture tasks.\n---\n\n${'Instruction content for an external tool.\n'.repeat(600)}`;
    writeFileSync(join(project, '.agents', 'skills', 'external', 'SKILL.md'), skill);
    writeFileSync(join(project, '.claude', 'skills', 'external', 'SKILL.md'), skill);
    writeFileSync(join(project, '.trellis', 'generated-skills.json'), JSON.stringify({
      schema_version: 1,
      files: ['.claude/skills/external'],
    }));
    cpSync(
      join(root, '.trellis', 'scripts', 'evolve-skills.mjs'),
      join(project, '.trellis', 'scripts', 'evolve-skills.mjs'),
    );

    const result = spawnSync(process.execPath, ['.trellis/scripts/evolve-skills.mjs'], {
      cwd: project,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stderr, /WARN: external.*500 lines/i);
    assert.match(result.stdout, /PASS:/);
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
