import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  STACKS,
  buildInitArgs,
  parseYesNo,
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
    stack: 'python',
    graphify: true,
    bounds: false,
  }), [
    '.trellis/init.sh',
    'Example',
    '--stack=python',
    '--with-graphify',
  ]);

  const source = readFileSync(new URL('../scripts/wizard.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /--tier|Tier\?/);
});

test('wizard yes/no defaults match the choice displayed to the user', () => {
  assert.equal(parseYesNo('', false), false);
  assert.equal(parseYesNo('', true), true);
  assert.equal(parseYesNo('yes', false), true);
  assert.equal(parseYesNo('N', true), false);
  assert.equal(parseYesNo('maybe', false), null);
});

test('wizard does not expose no-op agent or tier selection', () => {
  const source = readFileSync(new URL('../scripts/wizard.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /--agents|Which AI agents|--tier|Tier\?/);
  assert.doesNotMatch(source, /Install (?:Graphify|Bounds)/);
  assert.match(source, /project-wide requirement/i);
  assert.match(source, /keep configured/i);
  assert.match(source, /trellis config enable\|disable/i);
});
