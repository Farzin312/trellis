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

Not all platforms may be active in this project. Check `.trellis/config.json`
for the `active_agents` list. Skills only mirror to active platforms.

## The 5 load-bearing rules

1. SDD before code — non-trivial change -> spec chain -> `docs/sdd/sdd.md`
   - Trivial (skip SDD): single-file fix <3 lines, config, typo, dep bump
   - Non-trivial: >1 file, behavior change, auth/money/security, new endpoint
2. Code is source of truth — docs follow code unless code is contradicting
3. Doc references update with every code change — same commit
4. Bug fixes get categorized entries in `docs/bug-fixes/`
5. No unrequested abstractions (Ponytail) — start lazy, scale to project tier

## Skill catalog

All skills live in `.trellis/agents/skills/` and are mirrored to all 4 platforms.
Load them when the delegation matrix says to, or when trigger conditions match.

| Skill | When to load | What it does |
|-------|-------------|--------------|
| `sdd` | Non-trivial change | Drives the 9-phase SDD pipeline |
| `api-routes` | Writing routes/handlers | 8-step auth-validation-response discipline |
| `db-migrations` | Writing migrations | RLS, FK rules, 15-tool adapter detection |
| `frontend-ui` | Writing UI components/pages | Accessibility, performance, design system |
| `docs-maintenance` | Editing docs/** | Breadcrumbs, single-owner, doc-code sync |
| `security-review` | Auth/money/RLS changes | Audit checklist, blocking findings |
| `quality-gates` | Verify phase / pre-merge | All checks: lint, build, test, mutation, docs |
| `ponytail-review` | Review phase | Scale-aware over-engineering flags (advisory) |
| `skill-evolution` | After 3+ similar tasks | Create or evolve skills |

## Delegation matrix (how work routes to specialists)

When working in SDD phases, route work by file pattern:

| Phase | File pattern | Route to | Pass to sub-agent |
|-------|-------------|----------|-------------------|
| Plan | API/route contracts | `api-routes` | FR refs + template |
| Plan | Data model | `db-migrations` | FR refs + template |
| Plan | Frontend | `frontend-ui` | FR refs + stub |
| Plan | Security risks | `security-review` | AUTH/EDGE refs |
| Implement | api/routes/** | `api-routes` | Task ID + paths + FR refs ONLY |
| Implement | migrations/** | `db-migrations` | Same + RLS rules |
| Implement | components/app/** | `frontend-ui` | Task ID + paths + FR refs ONLY |
| Implement | docs/** | `docs-maintenance` | Task ID + paths |
| Review | Every changed file | `ponytail-review` | Changed files + task IDs |
| Verify | Whole feature | `quality-gates` | Run results |

**Context isolation rule**: pass ONLY Task ID, "Done when" condition, target
file paths, and FR/SC reference IDs. DO NOT pass the full artifact chain.
Sub-agents return compact summaries, not raw output.

**Verifier != executor**: the agent that wrote the code NEVER reviews it.
Use a fresh sub-agent for review.

## Read order by task

| You're about to... | Read these |
|---------------------|------------|
| Start a feature | mandate -> `docs/sdd/sdd.md` -> load `sdd` skill |
| Implement an API route | mandate -> load `api-routes` skill |
| Write a migration | mandate -> load `db-migrations` skill |
| Build UI | mandate -> load `frontend-ui` skill |
| Fix a bug | `docs/bug-fixes/` -> relevant subsystem doc |
| Fix a trivial bug (<3 lines) | just fix + lint + commit |
| Review code | load `ponytail-review` skill |
| Pre-merge verification | load `quality-gates` skill |
| Create/evolve a skill | load `skill-evolution` skill |

## Knowledge graph (Tier 2+)

If Graphify is installed: query the graph BEFORE reading source files. The graph
covers code, SQL schemas, and docs (`graphify-out/graph.json`).

- **Query** (do this first): `graphify query "<question>"` — natural-language answer.
- **Explain a node**: `graphify explain "<name>"` — a node plus its neighbors.
- **Trace a path**: `graphify path "A" "B"` — shortest path between two nodes.
- **Build** (first time / from CLI): `trellis graph` (`graphify .`).
- **Refresh after code edits**: `trellis graph --update` (`graphify update .`) —
  incremental, **no LLM key needed** for a code-only change.
- **Freshness gate**: `npm run check:graph` warns when `graph.json` is stale.

Doc/paper extraction on a full build needs one LLM key
(`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`); a code-only repo needs none.

## Boundary enforcement (Tier 2+)

If Bounds is installed: `bounds describe <subsystem>` for public surface.
`bounds impact <name>` for blast radius. `bounds validate --quick` after edits.

Boundary violations are BLOCKING at Review:
- No upward imports (child cannot import parent internals)
- No cross-imports between sibling subsystems
- No circular dependencies
