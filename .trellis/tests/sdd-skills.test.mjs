import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
  const orchestrator = readFileSync(join(root, '.agents', 'skills', 'sdd', 'SKILL.md'), 'utf8');
  assert.match(orchestrator, /A\/B\/C\/D/);
  assert.match(orchestrator, /Analyze is active, not\s+report-only/i);
  assert.match(orchestrator, /repair fixable defects/i);
});

test('Clarify asks discoverable, recommended A/B/C/D questions until ambiguity is resolved', () => {
  const content = readFileSync(join(root, '.agents', 'skills', 'speckit-clarify', 'SKILL.md'), 'utf8');
  for (const label of ['A.', 'B.', 'C.', 'D.']) assert.match(content, new RegExp(`\\${label}`));
  assert.match(content, /Recommended:/);
  assert.match(content, /one to three/i);
  assert.match(content, /continue.*until.*material ambiguity/is);
  assert.match(content, /repository evidence/i);
  assert.match(content, /clarification log/i);
});

test('Analyze repairs fixable artifact defects, reruns, and never writes implementation code', () => {
  const content = readFileSync(join(root, '.agents', 'skills', 'speckit-analyze', 'SKILL.md'), 'utf8');
  assert.match(content, /traceability matrix/i);
  assert.match(content, /repair.*owning artifact/is);
  assert.match(content, /re-run.*Analyze/i);
  assert.match(content, /must not write.*implementation code/is);
  assert.match(content, /A\/B\/C\/D/);
});

test('the scaffold includes complete phase evidence templates', () => {
  for (const name of ['spec', 'plan', 'tasks', 'checklist', 'analysis', 'review', 'verify']) {
    assert.ok(existsSync(join(root, '.specify', 'templates', `${name}-template.md`)), name);
  }
  const spec = readFileSync(join(root, '.specify', 'templates', 'spec-template.md'), 'utf8');
  assert.match(spec, /## Success Criteria/);
  assert.match(spec, /\*\*SUCCESS-001\*\*/);
  const tasks = readFileSync(join(root, '.specify', 'templates', 'tasks-template.md'), 'utf8');
  assert.match(tasks, /Status/);
});
