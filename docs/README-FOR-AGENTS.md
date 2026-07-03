# AI Agent Entry Point

> Parent: `docs/README.md`
> Audience: AI coding agents (Claude Code, Codex CLI, OpenCode, GitHub Copilot)

Read this first. It routes you to every load-bearing rule without grepping.

## Platform-specific mandate files

| Platform | Mandate | When to read |
|----------|---------|--------------|
| Claude Code | `CLAUDE.md` | Always (auto-read) |
| Codex CLI / OpenCode | `AGENTS.md` | Always (auto-read) |
| GitHub Copilot | `AGENTS.md` | Always (auto-read) |

## The 5 load-bearing rules

1. SDD before code — non-trivial change -> spec chain -> `docs/sdd/sdd.md`
2. Code is source of truth — docs follow code unless code is contradicting
3. Doc references update with every code change — same commit
4. Bug fixes get categorized entries in `docs/bug-fixes/`
5. No unrequested abstractions (Ponytail) — start lazy, mark deviations

## Skill catalog

| Skill | When |
|-------|------|
| `sdd` | Drive the SDD flow end-to-end |
| `api-routes` | Backend route work |
| `frontend-ui` | Server Components, design system |
| `db-migrations` | Schema migrations + RLS |
| `docs-maintenance` | Edit anything under `docs/` |
| `quality-gates` | Pre-merge correctness sweep |
| `security-review` | Auth / money / RLS audit |

## Read order by task

| You're about to... | Read these |
|---------------------|------------|
| Implement an API route | mandate -> `docs/sdd/sdd.md` -> `docs/api-reference/` |
| Add a UI surface | mandate -> `docs/frontend/` |
| Fix a bug | `docs/bug-fixes/` -> relevant subsystem doc |
| Migrate a table | `docs/database/` -> SDD Plan phase |

## Knowledge graph (Tier 2+)

If Graphify is installed: query the graph BEFORE reading source files. `graphify query "<question>"`. The graph covers code, SQL schemas, docs, and live DB introspection.

## Agent handoffs (Tier 3)

If handoffs are configured: delegate to specialists mid-task. See `.agents/handoffs/registry.yaml`.
