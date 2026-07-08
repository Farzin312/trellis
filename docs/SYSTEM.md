# How Trellis Works as a System

> Parent: `docs/README.md`

This document explains how every piece of Trellis connects. It is the map a
new contributor or adopter reads to understand the whole before diving into
individual components.

---

## The Core Loop

Everything in Trellis serves one loop: a change goes from idea to shipped
code, passing through guardrails at every step.

```
         ┌──────────────────────────────────────────────────────────┐
         │                                                          │
         │   1. IDEA                                                │
         │   "Add a password reset flow"                            │
         │          │                                               │
         │          ▼                                               │
         │   2. SDD PIPELINE                                        │
         │   Specify → Clarify → Plan → Tasks → Checklist           │
         │   → Analyze → Implement → Review → Verify                │
         │          │                                               │
         │          │   At each phase:                              │
         │          │   ├─ AGENTS.md routes the agent               │
         │          │   ├─ Graphify answers "how does X work?"      │
         │          │   ├─ Bounds answers "is this allowed?"        │
         │          │   ├─ Handoffs delegate to specialists         │
         │          │   ├─ Constitution enforces invariants         │
         │          │   └─ Templates ensure consistency             │
         │          │                                               │
         │          ▼                                               │
         │   3. CODE + TESTS                                        │
         │   TDD: [TEST] first, then implementation                 │
         │          │                                               │
         │          ▼                                               │
         │   4. EVALS                                               │
         │   StrykerJS + fast-check + golden tests + CI checks      │
         │          │                                               │
         │          ▼                                               │
         │   5. SHIP                                                │
         │   Docs synced, mutation score met, boundaries clean      │
         │          │                                               │
         │          ▼                                               │
         │   6. EVOLVE                                              │
         │   Evolution Agent checks: are the rules still right?     │
         │                                                          │
         └──────────────────────────────────────────────────────────┘
```

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENT ENTRY POINTS                              │
│                                                                         │
│   AGENTS.md ◄── Claude Code, Codex, OpenCode, Copilot all read this    │
│       │                                                                 │
│       ├──► docs/README-FOR-AGENTS.md (routing for AI agents)           │
│       ├──► docs/STRUCTURE.md (documentation rules)                      │
│       ├──► .specify/memory/constitution.md (11 invariants)             │
│       └──► docs/coding-standards.md (code quality canon)               │
│                                                                         │
│   CLAUDE.md ◄── byte-synced copy of AGENTS.md for Claude Code          │
│   (check-mandate-sync.mjs enforces they match)                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SDD PIPELINE (9 phases)                         │
│                                                                         │
│   .specify/templates/commands/  ◄── SINGLE SOURCE (9 files)            │
│       │                                                                 │
│       ├── generate-commands.mjs ──► .claude/commands/ (9 files)        │
│       │                              .codex/prompts/ (9 files)          │
│       │                              .opencode/command/ (9 files)       │
│       │                              .github/agents/ (9 files)          │
│       │                                                                 │
│       └── check-command-sync.mjs ──► CI verifies all 4 match source    │
│                                                                         │
│   Each phase:                                                            │
│   specify → clarify → plan → tasks → checklist → analyze               │
│   → implement → review → verify                                        │
│                                                                         │
│   .specify/specs/ ◄── one folder per spec: <NNN>-<slug>/               │
│       ├── spec.md                                                       │
│       ├── plan.md                                                       │
│       ├── contracts.md                                                  │
│       ├── tasks.md                                                      │
│       ├── analysis.md                                                   │
│       ├── verify.md                                                     │
│       └── checklists/                                                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────┬─────────────────────────┬────────────────────┐
│   CODE INTELLIGENCE     │   BOUNDARY ENFORCEMENT  │   HANDOFF LOOPS    │
│   (Graphify)            │   (Bounds)              │                    │
│                         │                         │   .trellis/agents/handoffs/ │
│   graphify-out/         │   .bounds/              │   registry.yaml    │
│   ├── graph.json        │   ├── root.yaml         │                    │
│   ├── graph.html        │   ├── manifests/        │   10 specialists:  │
│   └── GRAPH_REPORT.md   │   └── cache.db          │   api-routes       │
│                         │                         │   db-migrations    │
│   Agents query BEFORE   │   Prescriptive rules    │   frontend-ui      │
│   reading source files  │   enforced at CI        │   security-review  │
│                         │                         │   migration-val    │
│   PreToolUse hooks      │   SDD-integrated at     │   bug-hunter       │
│   auto-nudge to graph   │   every phase           │   docs-maintenance │
│                         │                         │   docs-sync        │
│   check-graph-          │   check-agnostic.mjs    │   quality-gates    │
│   freshness.mjs         │   keeps framework       │   ponytail-review  │
│   (staleness gate)      │   stack-agnostic        │                    │
│                         │                         │   Loop guards:     │
│                         │                         │   max depth 5,     │
│                         │                         │   max iter 20      │
└─────────────────────────┴─────────────────────────┴────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              EVAL SYSTEM                                 │
│                                                                         │
│   run-evals.mjs orchestrates:                                           │
│       │                                                                 │
│       ├─► Vitest + fast-check (unit + property tests)                  │
│       │     vitest.config.ts ──► 80% coverage thresholds              │
│       │                                                                 │
│       ├─► StrykerJS (mutation testing)                                 │
│       │     stryker.config.json ──► break threshold: 50                │
│       │                                                                 │
│       ├─► Golden tests (per-spec locked suites)                        │
│       │     .trellis/tests/golden/<NNN>-<slug>.test.ts                          │
│       │                                                                 │
│       └─► Arize Phoenix (self-hosted observability)                    │
│             docker-compose.phoenix.yml ──► localhost:6006              │
│                                                                         │
│   Framework health checks (always run):                                │
│       check-mandate-sync.mjs ── AGENTS.md = CLAUDE.md                  │
│       check-command-sync.mjs ── all 4 platforms in sync               │
│       docs-sync.mjs ────────── doc links resolve, breadcrumbs valid   │
│       check-agnostic.mjs ───── no stack hardcoding in core files      │
│       check-migration-safety.mjs ─ multi-tool migration evals         │
│       check-ponytail.mjs ────── marker format validation (advisory)   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVOLUTION ENGINE                               │
│                                                                         │
│   Weekly audit cycle:                                                   │
│       │                                                                 │
│       ├─► Stack drift: does reality match the constitution?            │
│       ├─► Tool versions: are commands using deprecated flags?          │
│       ├─► Failure patterns: are agents repeating mistakes?             │
│       ├─► Redundancy: are two agents doing the same thing?             │
│       │                                                                 │
│       ▼                                                                 │
│   .trellis/agents/evolution/YYYY-MM-DD-report.md                               │
│       │                                                                 │
│       ▼                                                                 │
│   SDD review (the framework reviews itself)                            │
│       │                                                                 │
│       ▼                                                                 │
│   Change ships through the normal SDD pipeline                        │
│                                                                         │
│   The Evolution Agent NEVER auto-applies. It proposes.                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How Data Flows

### During a feature build

```
Developer says: /specify "Add password reset"
                    │
                    ▼
Specify phase creates .specify/specs/045-password-reset/spec.md
                    │
                    ▼
Agent reads AGENTS.md → learns the 5 rules + where everything is
                    │
                    ▼
Plan phase:
  ├── Graphify query: "how does auth work?" → graph tells agent
  ├── Bounds describe: auth subsystem → agent knows boundaries
  ├── Handoff: security-review specialist → assesses risk
  └── Agent writes plan.md, contracts.md, risks.md
                    │
                    ▼
Implement phase:
  ├── Handoff: api-routes specialist → writes the route
  ├── Handoff: db-migrations specialist → writes the migration
  ├── Implicit trigger: migration created → migration-validator runs
  ├── Handoff: frontend-ui specialist → writes the UI
  └── Handoff: docs-maintenance specialist → updates docs
                    │
                    ▼
Review phase:
  └── ponytail-review flags over-engineering (advisory)
                    │
                    ▼
Verify phase:
  ├── Vitest runs full suite (count must not decrease)
  ├── fast-check runs property tests
  ├── StrykerJS runs mutation testing (score >= threshold)
  ├── check-migration-safety.mjs runs (detected tool adapter)
  ├── docs-sync.mjs verifies no drift
  └── verify.md flips to COMPLETE
                    │
                    ▼
SHIP. Golden test freezes the spec's test suite.
```

### During evolution

```
Weekly cron fires
        │
        ▼
adapt-to-project.mjs + evolution checks run
        │
        ├── Reads package.json → detects stack
        ├── Cross-references constitution → stack drift?
        ├── Checks installed tool versions → deprecated?
        ├── Queries Phoenix (if running) → failure patterns?
        ├── Analyzes handoff registry → redundancy?
        │
        ▼
Produces .trellis/agents/evolution/report.md
        │
        ▼
Human reviews → creates SDD spec for proposed changes
        │
        ▼
Change goes through the same SDD pipeline as everything else
```

---

## The 12 Framework Scripts (How They Connect)

| Script | When It Runs | What It Catches |
|--------|-------------|-----------------|
| `generate-commands.mjs` | After editing command sources | Regenerates 4-platform mirrors |
| `check-mandate-sync.mjs` | CI + pre-commit | AGENTS.md drifted from CLAUDE.md |
| `check-command-sync.mjs` | CI | Command mirrors drifted from source |
| `docs-sync.mjs` | CI + pre-commit | Broken doc links, missing breadcrumbs |
| `check-agnostic.mjs` | CI | Stack-specific code in framework files |
| `check-migration-safety.mjs` | CI + Implement phase | Bad migrations (RLS, FK, version dupes) |
| `check-graph-freshness.mjs` | CI | Knowledge graph is stale |
| `check-ponytail.mjs` | CI (advisory) | Ponytail markers missing format |
| `adapt-to-project.mjs` | During init.sh | Detects stack, adapts constitution |
| `handoff-engine.mjs` | On demand | Validates handoff registry |
| `run-evals.mjs` | CI + `trellis eval` | Runs full eval suite |
| `cli.mjs` | User-invoked | Entry point for all commands |

---

## Migration Tool Support Matrix

Trellis detects your migration tool and runs appropriate checks.

| Tool | Detects | RLS Check | FK Check | Status |
|------|---------|-----------|----------|--------|
| Supabase | supabase/migrations/*.sql | Yes | Yes | Supported |
| Prisma | prisma/migrations/*/migration.sql | No (schema-level) | Yes | Supported |
| Drizzle | drizzle/*.sql | Yes | Yes | Supported |
| Flyway | V*__*.sql | Yes | Yes | Supported |
| Alembic | alembic/versions/*.py | Yes | Yes | Supported |
| Rails | db/migrate/*.rb | No (raw SQL) | Yes | Supported |
| Django | migrations/*.py | No (RunSQL) | Yes | Supported |
| Knex | migrations/*.js | No (raw SQL) | Yes | Supported |
| golang-migrate | *_up.sql | Yes | Yes | Supported |
| TypeORM | migrations/*.ts | No (raw query) | Yes | Supported |
| Goose | migrations/*.sql | Yes | Yes | Supported |
| Atlas | migrations/*.sql | Yes | Yes | Supported |
| Sequelize | migrations/*.js | No (raw query) | Yes | Supported |
| node-pg-migrate | migrations/*.js | Yes | Yes | Supported |
| Liquibase | db/changelog/*.xml | Yes (parse) | Yes | Limited |
| Custom tool | Not detected | — | — | Not supported |

When a tool is not detected, the script reports which directories it checked
and suggests creating internal tooling or adding an adapter to
`.trellis/scripts/migration-adapters.json`.

For tools where RLS is not directly checkable (Prisma, Rails, Django, Knex,
TypeORM, Sequelize), the check is skipped with an explanatory note. This is
documented behavior, not a gap — these tools express RLS through raw SQL or
schema definitions that require runtime evaluation.

---

## The 5 Files Every Agent Reads First

1. **AGENTS.md** — the mandate (5 rules, routing, read order)
2. **docs/README-FOR-AGENTS.md** — AI-specific routing
3. **docs/STRUCTURE.md** — documentation rules
4. **docs/sdd/sdd.md** — the SDD flow
5. **.specify/memory/constitution.md** — 11 invariants

Everything else is loaded on demand.

---

## Ponytail: How It Fits

Ponytail is NOT a Trellis component — it is an external plugin agents install
separately. Trellis's relationship to Ponytail:

```
Ponytail plugin (external)
    │
    ├── Injects at session start via agent plugin hooks
    │   (NOT pasted into AGENTS.md — that bloats docs)
    │
    └── Agents apply: stdlib first, one line over fifty

Trellis's role:
    │
    ├── Documents install commands (docs/ponytail-setup.md)
    ├── Provides marker format:
    │     # ponytail: <ceiling>, upgrade: <path>
    │     # trellis: full-impl, <reason>
    ├── CI validates marker FORMAT (advisory, non-blocking)
    └── ponytail-review handoff specialist flags over-engineering
        (advisory — the reviewer decides, not the script)
```

---

## What Makes Trellis Different

| Dimension | Typical scaffold | Trellis |
|-----------|-----------------|---------|
| Mandate | 1 AGENTS.md file | Synced mandate + 4-platform commands |
| Navigation | Agent greps files | Graphify always-on knowledge graph |
| Boundaries | Hope + code review | Bounds CI-enforced manifests |
| Test quality | Coverage % | Mutation testing (StrykerJS) |
| Edge cases | Manual | Property testing (fast-check) |
| Regressions | Hope | Golden test suites per spec |
| Agent memory | Session-only | Portable context (.trellis/agents/context/) |
| Migrations | Single tool | 15-tool adapter detection |
| Staleness | Manual | Self-evolving engine |
| Stack | One hardcoded | Agnostic + adaptive |
