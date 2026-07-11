import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  STACKS,
  buildInitArgs,
  parseAgentSelection,
} from '../scripts/wizard.mjs';

test('wizard stack choices map directly to canonical stack values', () => {
  assert.deepEqual(STACKS, {
    'auto-detect': '',
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    go: 'go',
    rust: 'rust',
    generic: 'generic',
  });
});

test('wizard maps optional integrations to explicit init flags without tiers', () => {
  assert.deepEqual(buildInitArgs({
    name: 'Example',
    agents: ['claude', 'codex'],
    stack: 'python',
    graphify: true,
    bounds: false,
  }), [
    '.trellis/init.sh',
    'Example',
    '--agents=claude,codex',
    '--stack=python',
    '--with-graphify',
  ]);

  const source = readFileSync(new URL('../scripts/wizard.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /--tier|Tier\?/);
});

test('wizard trims and deduplicates agent choices but rejects unknown values', () => {
  assert.deepEqual(parseAgentSelection(' 1, codex,1 '), ['claude', 'codex']);
  assert.throws(() => parseAgentSelection('claude,unknown'), /Unknown agent/);
  assert.throws(() => parseAgentSelection(''), /at least one agent/i);
});
