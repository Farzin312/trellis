import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Claude imports the canonical mandate without duplicating it', () => {
  const claude = readFileSync(new URL('../../CLAUDE.md', import.meta.url), 'utf8').trim();
  assert.equal(claude, '@AGENTS.md');
});
