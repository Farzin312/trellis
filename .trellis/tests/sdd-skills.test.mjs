import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../..', import.meta.url).pathname;
const phases = ['specify', 'clarify', 'plan', 'tasks', 'checklist', 'analyze', 'implement', 'review', 'verify'];

test('all nine SDD phases are canonical Agent Skills', () => {
  for (const phase of phases) {
    const content = readFileSync(join(root, '.agents', 'skills', `speckit-${phase}`, 'SKILL.md'), 'utf8');
    assert.match(content, new RegExp(`name: speckit-${phase}`));
    assert.match(content, /description:/);
  }
});

test('SDD phase order is stable', () => {
  const content = readFileSync(join(root, 'docs', 'sdd', 'sdd.md'), 'utf8');
  assert.match(content, /Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify/);
});
