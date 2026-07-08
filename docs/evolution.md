# Trellis Skill Evolution & Health

> Parent: `docs/README.md`

Agents and skills are not static. They grow when patterns are discovered,
and they improve when existing instructions fail in practice. This document
explains how Trellis's skill system evolves over time.

---

## How Skills Grow

Skills grow in two ways: new skills are created, and existing skills
are improved. Both are agent-driven, not cron-driven.

### Creating New Skills

When an agent (Claude Code, Codex, OpenCode, or Copilot) completes 3+
similar tasks that no existing skill covers, it should create a skill.

The process is in `.trellis/agents/skills/skill-evolution/SKILL.md`:

1. Create `.trellis/agents/skills/<name>/SKILL.md` (under 3KB)
2. Run `node .trellis/.trellis/scripts/generate-skills.mjs` to mirror to all 4 platforms
3. Add to the delegation matrix in AGENTS.md
4. Register in the skill table in docs/README-FOR-AGENTS.md

Any agent on any platform can do this. The SKILL.md format is the
cross-tool standard.

### Evolving Existing Skills

When a skill's instructions are wrong, incomplete, or outdated, any
agent should fix them:

1. Read the current SKILL.md
2. Fix the issue
3. Bump the version (1.0.0 -> 1.1.0 for additions, 2.0.0 for breaking)
4. Add an entry to the skill's Evolution Log
5. Run `node .trellis/.trellis/scripts/generate-skills.mjs` to re-mirror

### When NOT to Create a Skill

- One-off tasks that won't recur
- Tasks that overlap >50% with an existing skill (evolve that one instead)
- Tasks that are just "read the docs and follow them"

---

## Deterministic Health Checks (Zero Tokens)

Instead of a fictional "evolution agent" that burns tokens on speculation,
Trellis uses deterministic scripts that check framework health. These
run in CI or manually. Zero LLM tokens consumed.

### Stack Drift Detection

`.trellis/scripts/evolve-skills.mjs` checks skill health:
- All skills have valid frontmatter
- All skills are mirrored to all 4 platforms
- No dangling file references
- No redundant skill pairs (>50% keyword overlap)
- All delegation-matrix-referenced skills actually exist

Run manually:
```bash
node .trellis/.trellis/scripts/evolve-skills.mjs           # check mode
node .trellis/.trellis/scripts/evolve-skills.mjs --report  # verbose report
```

### Framework Integrity Checks (existing)

These already run in CI:
- `check-mandate-sync.mjs` — AGENTS.md = CLAUDE.md
- `check-command-sync.mjs` — all 36 command mirrors in sync
- `check-agnostic.mjs` — no stack hardcoding in core files
- `docs-sync.mjs` — doc links resolve, breadcrumbs valid
- `check-migration-safety.mjs` — migration safety checks
- `check-ponytail.mjs` — marker format validation
- `handoff-engine.mjs validate` — delegation matrix valid

---

## How This Differs From the Original Design

The original evolution.md described 5 fictional scripts running on cron
schedules, querying Phoenix traces, and proposing framework changes via
LLM agents. None of that existed. This document describes what actually
works:

| Old design (fictional)             | New design (real)                      |
|------------------------------------|----------------------------------------|
| evolve-detect-stack.mjs            | Agent checks package.json vs constitution during SDD |
| evolve-check-versions.mjs          | Agent flags deprecated flags during Review |
| evolve-analyze-failures.mjs        | Agent creates bug-fix entries after test failures |
| evolve-detect-redundancy.mjs       | evolve-skills.mjs (deterministic)      |
| evolve-landscape-checklist.md      | Manual review during quarterly planning |
| Cron + LLM agent                   | Agent-driven during SDD phases         |
| Burns tokens on speculation        | Zero tokens for deterministic checks   |

The key insight: **agents evolve skills as a natural consequence of doing
work, not as a separate scheduled activity.** When an agent hits a missing
instruction during implementation, it fixes the skill right there. The
deterministic script just checks that the result is healthy.

---

## Evolution Log

Each skill tracks its own changes in an `## Evolution Log` section.
This creates a history of how the skill improved over time, visible to
any agent that loads it.
