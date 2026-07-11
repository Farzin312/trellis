import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
