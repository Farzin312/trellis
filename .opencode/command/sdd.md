---
name: sdd
description: |
  Drive the Spec-Driven Development flow end-to-end. Use for any
  non-trivial change (see trivial/non-trivial definition in AGENTS.md).
  Routes work through the 9-phase pipeline: Specify, Clarify, Plan,
  Tasks, Checklist, Analyze, Implement, Review, Verify. Auto-loads
  when the change does not meet the "trivial" escape hatch criteria.
version: 1.0.0
---

# SDD Flow Driver

## Overview

Drives non-trivial changes through the spec pipeline. Each phase has
a slash command on all 4 platforms (Claude Code, Codex, OpenCode,
Copilot), generated from a single source in .specify/templates/commands/.

## Trivial vs Non-Trivial (read first)

TRIVIAL (skip SDD, just fix + lint + commit):
- Single-file fix (typo, CSS-only, config value change)
- Dependency version bump
- Bug fix touching <3 lines in one file
- Adding a comment or doc string

NON-TRIVIAL (full SDD pipeline):
- Anything touching >1 file
- Anything changing behavior
- Anything touching auth, money, or security surfaces
- Anything adding a new endpoint, component, or migration

For trivial changes: make the fix, run lint, commit. No spec needed.

## The 9 Phases

```
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

| Phase | Command | Artifact | Skip? |
|-------|---------|----------|-------|
| Specify | `/specify` | spec.md | Never |
| Clarify | `/clarify` | updates spec.md | Zero open questions |
| Plan | `/plan` | plan.md, contracts.md, risks.md | Single-file changes |
| Tasks | `/tasks` | tasks.md | Never |
| Checklist | `/checklist` | checklists/*.md | Never |
| Analyze | `/analyze` | analysis.md (PASS/FAIL) | Never |
| Implement | `/implement` | code, tests, docs | Never |
| Review | `/review` | review.md | Never |
| Verify | `/verify` | verify.md | Never |

Never skip forward. Never write code before /analyze returns PASS.

## Delegation Matrix (how to route work)

| Phase | File Pattern | Route to | Pass to sub-agent |
|-------|-------------|----------|-------------------|
| Plan | API contracts | api-routes skill | FR refs + template |
| Plan | Data model | db-migrations skill | FR refs + template |
| Plan | Frontend | frontend-ui skill | FR refs + stub |
| Plan | Security risks | security-review skill | AUTH/EDGE refs |
| Implement | api/routes/** | api-routes skill | Task ID + paths + FR refs ONLY |
| Implement | migrations/** | db-migrations skill | Same + RLS rules |
| Implement | components/app/** | frontend-ui skill | Task ID + paths + FR refs ONLY |
| Implement | docs/** | docs-maintenance skill | Task ID + paths |
| Review | Every changed file | ponytail-review skill | Changed files + task IDs |
| Verify | Whole feature | quality-gates skill | Run results |

## Context Isolation Rule (critical for token efficiency)

When spawning sub-agents, pass ONLY:
- Task ID
- "Done when" condition
- Target file paths
- FR/SC reference IDs

DO NOT PASS: full artifact chain, conversation history, unrelated tasks.

Sub-agents return compact summaries, not raw output. Target 5x+
compression ratio (sub-agent processes 2K tokens, returns 200).

## Subsystem Boundary Discipline

Every project has subsystems. Subsystems have PUBLIC surfaces (what
other code can call) and PRIVATE internals (implementation details).
Respecting these boundaries is mandatory.

### Defining Boundaries

If Bounds is installed (Tier 2+): run `bounds describe <subsystem>`
to see the public surface in ~1KB of JSON. This replaces reading
8KB+ of source files.

If Bounds is not installed: document subsystem boundaries in
docs/systems/<subsystem>/README.md with:
  ## Public Surface
  - Functions/classes other subsystems may import
  ## Private Internals
  - Implementation details not for external use
  ## Dependencies
  - Which other subsystems this one depends on (allowed imports)
  ## Dependents
  - Which subsystems depend on this one (who calls us)

### Boundary Rules (enforced at Review phase)

1. **No upward imports** - a child subsystem cannot import from a
   parent subsystem's private internals
2. **No cross-imports** - sibling subsystems communicate through
   public surfaces, not internal helpers
3. **No circular dependencies** - if A depends on B, B cannot depend on A
4. **New files go in their owning subsystem** - never create a file
   in another subsystem's directory

### Boundary Violations (BLOCKING at Review)

If the Review phase detects any of these, the change CANNOT merge:
- Import from a subsystem's private internals
- Circular dependency introduced
- Public surface changed without updating dependent subsystem docs
- New file placed in wrong subsystem directory

### Checking Boundaries

During SDD phases:
- Plan: `bounds describe <subsystem>` (or read docs/systems/) before
  designing changes to understand the public surface
- Tasks: `bounds where <symbol>` to verify file paths are correct
- Analyze: `bounds validate --quick` MUST exit clean before PASS
- Implement: `bounds describe <parent>` on entry, `bounds validate --quick`
  on exit (prevents one sub-agent's edits from going stale for another)
- Review: boundary violations are BLOCKING
- Verify: `bounds validate --quick` on the verify checklist

## Parallel Tasks

Tasks marked `[P]` in tasks.md MUST dispatch as concurrent sub-agent
calls in a single message. Independent domains (API + DB + frontend)
run simultaneously.

## When to Load

Load this skill when:
- Starting any non-trivial change
- The trivial/non-trivial test says "non-trivial"
- Driving an existing spec through the pipeline
