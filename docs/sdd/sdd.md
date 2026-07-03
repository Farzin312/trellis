# SDD — Spec-Driven Development Policy

> Parent: `docs/README.md`

## Part 0 — Model-Agnostic by Design

SDD works with any AI agent. Slash commands exist on all 4 platforms (Claude Code, Codex, OpenCode, Copilot), generated from a single source in `.specify/templates/commands/`.

## Part 1 — The Flow

```
Specify -> Clarify -> Plan -> Tasks -> Checklists -> Analyze -> Implement -> Review -> Verify
```

| Step | Artifact | Command | Skip? |
|------|----------|---------|-------|
| Specify | `spec.md` | `/specify` | Never |
| Clarify | updates `spec.md` | `/clarify` | When zero open questions |
| Plan | `plan.md`, `contracts.md`, `risks.md` | `/plan` | Single-file changes only |
| Tasks | `tasks.md` | `/tasks` | Never |
| Checklists | `checklists/*.md` | `/checklist` | Never (requirements always required) |
| Analyze | `analysis.md` | `/analyze` | Never |
| Implement | code, tests, docs | `/implement` | Never |
| Review | `review.md` | `/review` | Never |
| Verify | `verify.md` | `/verify` | Never |

## Part 2 — Non-Redundancy

Requirements are referenced by ID (FR-XXX, SC-XXX, R-XXX, BUG-NNN) across artifacts. Never restate.

## Part 3 — TDD

Every implementation task has a paired `[TEST]` task. Tests first (Red), then implementation (Green), then refactor.

## Part 4 — Agent Delegation (Tier 3 handoff loops)

Plan phase dispatches domain subagents in parallel: api-routes, db-migrations, frontend-ui, security-review. Each receives only task ID + file paths + FR/SC refs — never the full artifact chain.

In Tier 3 with handoff loops enabled, agents can also delegate mid-task via the handoff registry.
