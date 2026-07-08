---
name: skill-evolution
description: |
  Self-growing skill system. Creates new skills when agents discover
  repeated patterns, and evolves existing skills based on field
  experience. Use when an agent has completed 3+ similar tasks that
  no existing skill covers, or when a skill's instructions proved
  insufficient or wrong during real use. Auto-loads on the /review
  phase when the reviewer identifies recurring patterns.
version: 1.0.0
---

# Skill Evolution

## Overview

Skills are not static. They grow when agents discover patterns worth
capturing, and they improve when existing instructions fail in practice.
This skill governs that growth. It works on all active platforms.

IMPORTANT: When you create or edit a skill, it automatically syncs to
ALL active agent platforms via generate-skills.mjs. You do NOT need to
manually copy to each platform. Edit once in .trellis/agents/skills/, run the
generator, done.

## Which Agents Are Active?

Check `.trellis/config.json`:
```json
{
  "active_agents": ["claude", "codex", "opencode", "copilot"]
}
```

This controls which platforms receive skills. A user who only runs
Claude Code might have:
```json
{ "active_agents": ["claude"] }
```

In that case, generate-skills.mjs only mirrors to .claude/skills/.
Codex, OpenCode, and Copilot directories are left empty.

To change active agents:
```bash
# Edit .trellis/config.json, then:
node .trellis/scripts/generate-skills.mjs         # re-mirror to new set
node .trellis/scripts/generate-skills.mjs --prune  # also remove stale mirrors
```

Or via init.sh:
```bash
./init.sh "Project" --agents=claude,copilot
```

## When to Create a New Skill

Create a new skill when ALL of these are true:

1. You have completed 3+ tasks that share a common workflow
2. No existing skill covers this workflow
3. The workflow has clear trigger conditions (specific file paths,
   task types, or phase boundaries)
4. The workflow is non-trivial (worth ~500 tokens of instructions)

Do NOT create a skill for:
- One-off tasks that won't recur
- Tasks that are just "read the docs and follow them"
- Tasks that overlap >50% with an existing skill (evolve that skill instead)

## How to Create a New Skill

1. Create `.trellis/agents/skills/<name>/SKILL.md` following this format:
   ```
   ---
   name: <name>
   description: |
     What it does + when to use it + trigger conditions.
     This description is how agents decide to load it.
   version: 1.0.0
   ---

   # <Title>

   ## Overview
   2-3 lines on what this skill does.

   ## Workflow
   Numbered steps, specific to this domain.

   ## When to Load
   Trigger conditions.

   ## Output Expectations
   What the sub-agent returns.
   ```

2. Keep it under 2KB (500 tokens). Skills that exceed this should
   split into references/ subdirectories for progressive disclosure.

3. Run: `node .trellis/scripts/generate-skills.mjs` to mirror to all platforms.

4. Add to the delegation matrix in the SDD skill and AGENTS.md.

5. Register in the skill table in docs/README-FOR-AGENTS.md.

## When to Evolve an Existing Skill

Evolve a skill when:

1. You followed its instructions and they were WRONG or INCOMPLETE
2. You discovered a step that should be there but isn't
3. A workflow step is outdated (references a renamed function, removed
   API, or changed pattern)
4. The skill is missing a pitfall or edge case you hit

## How to Evolve an Existing Skill

1. Read the current SKILL.md.
2. Identify what's missing or wrong.
3. Add the missing step or fix the wrong one.
4. Bump the version in frontmatter (1.0.0 -> 1.1.0 for additions,
   2.0.0 for breaking changes to the workflow).
5. Add a brief note at the bottom of the skill:
   ```
   ## Evolution Log
   - 1.1.0: Added step X after discovering <edge case> during <task>
   ```
6. Run: `node .trellis/scripts/generate-skills.mjs` to re-mirror.

## How to Remove a Skill (Careful)

1. Check if any other skill or AGENTS.md references it.
2. If referenced: update references first.
3. Delete the skill directory.
4. Run generate-skills.mjs (it cleans up stale mirrors).
5. Remove from delegation matrix and skill tables.

## The Deterministic Check

Run: `node .trellis/scripts/evolve-skills.mjs`

This script checks:
- All skills have valid frontmatter (name, description, version)
- All skills are mirrored to all 4 platforms (sync check)
- No skills reference files that don't exist
- No two skills overlap >50% on trigger conditions (redundancy)
- All skills referenced in the delegation matrix actually exist

## When to Load

Load this skill when:
- You've completed 3+ similar tasks not covered by a skill
- A skill's instructions failed during real use
- Running periodic skill maintenance
- The SDD Review phase surfaces a recurring pattern

## Output Expectations

Return:
- For new skill: the SKILL.md content + confirmation it was mirrored
- For evolved skill: what changed (diff summary) + new version number
- For removal: what was removed + references updated
- Always: generate-skills.mjs output confirming sync across platforms
