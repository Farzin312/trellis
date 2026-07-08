#!/usr/bin/env node
/**
 * handoff-engine.mjs
 *
 * Registry validator for the agent handoff system. Reads
 * .trellis/agents/handoffs/registry.yaml and validates its structural
 * integrity: duplicate names, dangling handoff targets, and contract
 * completeness.
 *
 * This is NOT a runtime. Real handoff execution is done by the agent's
 * native subagent dispatch:
 *   - Claude Code: Agent tool
 *   - Codex: multi_agent = true under [features]
 *   - OpenCode: Task tool
 *   - Copilot: agent files in .github/agents/
 *
 * This script provides:
 *   1. Validation (CI gate): every on_complete/on_fail handoff target
 *      resolves to a registered specialist. No dangling references.
 *   2. List: shows all registered specialists and their contracts.
 *
 * Usage:
 *   node .trellis/scripts/handoff-engine.mjs validate      # CI gate
 *   node .trellis/scripts/handoff-engine.mjs list           # list specialists
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const registryFile = join(root, '.trellis', 'agents', 'handoffs', 'registry.yaml');

const command = process.argv[2] || 'list';

if (!existsSync(registryFile)) {
  console.error('FAIL: .trellis/agents/handoffs/registry.yaml not found');
  process.exit(1);
}

// Minimal YAML parser for our registry format (avoids js-yaml dependency).
// Extracts specialists with their on_complete/on_fail handoff targets.
function parseRegistry(text) {
  const specialists = [];
  const lines = text.split('\n');
  let current = null;
  let inSpecialists = false;
  let inTriggers = false;
  let inInputContract = false;
  let inOutputContract = false;

  for (const line of lines) {
    // Section transitions
    if (line.startsWith('specialists:')) {
      inSpecialists = true;
      continue;
    }
    if (line.startsWith('phase_boundary_schedule:')) {
      inSpecialists = false;
      continue;
    }
    // Non-specialist section at top level ends parsing
    if (!inSpecialists && line.match(/^\S/) && !line.startsWith('#') && !line.startsWith('version:') && !line.startsWith('loop_guards:')) {
      continue;
    }

    if (!inSpecialists) continue;

    // New specialist entry
    const nameMatch = line.match(/^\s+- name:\s*(.+)/);
    if (nameMatch) {
      if (current) specialists.push(current);
      current = {
        name: nameMatch[1].trim().replace(/['"]/g, ''),
        description: '',
        triggers: [],
        on_complete_handoff: null,
        on_complete_return: false,
        on_fail_handoff: null,
        has_output_contract: false,
        output_must_include: [],
      };
      inTriggers = false;
      inInputContract = false;
      inOutputContract = false;
      continue;
    }

    if (!current) continue;

    // Description
    const descMatch = line.match(/^\s+description:\s*(.+)/);
    if (descMatch) {
      current.description = descMatch[1].trim().replace(/['"]/g, '');
      continue;
    }

    // Contract markers
    if (line.match(/^\s+input_contract:/)) {
      inInputContract = true;
      inOutputContract = false;
      inTriggers = false;
      continue;
    }
    if (line.match(/^\s+output_contract:/)) {
      inOutputContract = true;
      inInputContract = false;
      inTriggers = false;
      current.has_output_contract = true;
      continue;
    }
    if (line.match(/^\s+triggers:/)) {
      inTriggers = true;
      inInputContract = false;
      inOutputContract = false;
      continue;
    }

    // on_complete handoff
    if (line.match(/^\s+on_complete:/)) {
      inTriggers = false;
      inInputContract = false;
      inOutputContract = false;
      continue;
    }
    const handoffMatch = line.match(/^\s+handoff:\s*(\S+)/);
    if (handoffMatch && !inTriggers && !inInputContract && !inOutputContract) {
      // This is an on_complete or on_fail handoff target
      const target = handoffMatch[1].trim();
      // Determine if this is on_complete or on_fail based on context
      // We look backwards for the most recent on_complete/on_fail
      if (!current.on_complete_handoff) {
        current.on_complete_handoff = target;
      } else {
        current.on_fail_handoff = target;
      }
      continue;
    }

    // on_complete: return: caller
    if (line.match(/^\s+return:\s*caller/) && !inTriggers && !inInputContract && !inOutputContract) {
      current.on_complete_return = true;
      continue;
    }

    // on_fail section
    if (line.match(/^\s+on_fail:/)) {
      inTriggers = false;
      inInputContract = false;
      inOutputContract = false;
      continue;
    }

    // output_contract must_include items
    if (inOutputContract && line.match(/^\s+-\s+/)) {
      const item = line.replace(/^\s+-\s+/, '').trim().replace(/['"]/g, '');
      current.output_must_include.push(item);
    }
  }
  if (current) specialists.push(current);
  return { specialists };
}

const registryText = readFileSync(registryFile, 'utf8');
const registry = parseRegistry(registryText);

switch (command) {
  case 'list': {
    console.log('Specialists:');
    for (const s of registry.specialists) {
      console.log(`  ${s.name}`);
      if (s.description) console.log(`    ${s.description}`);
      if (s.on_complete_handoff) console.log(`    on_complete -> ${s.on_complete_handoff}`);
      if (s.on_fail_handoff) console.log(`    on_fail -> ${s.on_fail_handoff}`);
    }
    break;
  }

  case 'validate': {
    const names = new Set(registry.specialists.map(s => s.name));
    let failures = 0;
    let warnings = 0;

    // 1. Duplicate name check
    const nameList = registry.specialists.map(s => s.name);
    const duplicates = nameList.filter((n, i) => nameList.indexOf(n) !== i);
    if (duplicates.length > 0) {
      console.error(`FAIL: duplicate specialist names: ${duplicates.join(', ')}`);
      failures++;
    }

    // 2. Dangling handoff targets: every on_complete/on_fail handoff
    //    must resolve to a registered specialist name.
    for (const s of registry.specialists) {
      if (s.on_complete_handoff && s.on_complete_handoff !== 'null') {
        if (!names.has(s.on_complete_handoff)) {
          console.error(`FAIL: ${s.name}.on_complete handoff target "${s.on_complete_handoff}" does not exist in registry`);
          failures++;
        }
      }
      if (s.on_fail_handoff && s.on_fail_handoff !== 'null') {
        if (!names.has(s.on_fail_handoff)) {
          console.error(`FAIL: ${s.name}.on_fail handoff target "${s.on_fail_handoff}" does not exist in registry`);
          failures++;
        }
      }
    }

    // 3. Contract completeness: every specialist should have output_contract
    for (const s of registry.specialists) {
      if (!s.has_output_contract) {
        console.warn(`WARN: ${s.name} has no output_contract`);
        warnings++;
      }
    }

    // Summary
    if (failures === 0) {
      console.log(`PASS: ${registry.specialists.length} specialists validated, no dangling targets`);
      if (warnings > 0) {
        console.log(`      ${warnings} warning(s) (non-blocking)`);
      }
    } else {
      console.error(`\n${failures} validation failure(s)`);
    }
    process.exit(failures > 0 ? 1 : 0);
  }

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Usage: handoff-engine.mjs [validate|list]');
    process.exit(1);
}
