# Trellis Tiers

What each adoption level requires and why.

Trellis is a cloneable AI-ready project scaffold. Not everyone needs every tool
on day one. Tiers let you adopt progressively — Tier 1 gets you a working
AI-agent-ready repo in 2 minutes, Tier 3 gives you the full eval + handoff +
graph system. All tiers use 100% free, open-source tools.

---

## Tier 0 — Bare Bones (the scaffold itself)

What it is: the directory structure, mandate file pattern, and documentation
rules. No tooling installed. Use this when you want to adopt Trellis
conventions into an existing repo manually.

Files: AGENTS.md, CLAUDE.md (symlink), docs/STRUCTURE.md, docs/coding-standards.md,
.specify/memory/constitution.md, .agents/handoffs/registry.yaml

Time to set up: 0 minutes (it ships with the clone).
Dependency cost: zero.
Agent benefit: agents read AGENTS.md and know where everything lives.

When to stop here: never. This is the foundation, not a stopping point. Move to
Tier 1 as soon as you start writing code.

---

## Tier 1 — Core SDD + Mandate Sync (minimum viable)

What it is: Spec-Driven Development pipeline with cross-tool command mirroring.
Write a spec once, run it through Claude Code, Codex, OpenCode, or Copilot —
they all follow the same phases.

Requires:
- AGENTS.md (cross-tool mandate, byte-synced to CLAUDE.md)
- .specify/ constitution + templates + command sources
- scripts/generate-commands.mjs (emits platform-specific command mirrors)
- scripts/check-mandate-sync.mjs (CI gate: AGENTS.md and CLAUDE.md match)
- scripts/check-command-sync.mjs (CI gate: all command mirrors in sync)
- scripts/docs-sync.mjs (regenerates auto-docs, checks breadcrumbs)
- docs/STRUCTURE.md (12 documentation rules)
- docs/sdd/sdd.md (the SDD flow policy)
- .github/workflows/ci.yml (lint + test + docs check)
- Pre-commit hook (mandate sync + command sync + docs check)

Tools installed: node only.
Time to set up: `./init.sh "My Project"` — under 1 minute.
Agent benefit: agents follow a structured Specify -> Clarify -> Plan -> Tasks ->
Analyze -> Implement -> Verify pipeline. Every phase has a slash command on all
4 platforms. Doc-code drift is mechanically caught.

The Ponytail integration lives here. Ponytail is a lazy-senior-dev plugin that
prevents over-engineering. It is installed as a PLUGIN per agent (not pasted
into AGENTS.md — that bloats docs and drifts). Trellis documents the install
commands but does not inline the ruleset.

IMPORTANT: Ponytail is a DEFAULT POSTURE, not a hard gate. The lazy solution
is the starting point — but it is not always correct. Stdlib has bugs,
one-liners hide edge cases, and some abstractions are genuinely needed. CI
never blocks builds for "over-engineering." Instead:

  - # ponytail: <ceiling>, upgrade: <path>  — marks a deliberate simplification
  - # trellis: full-impl, <reason>          — marks a deliberate expansion

The CI check (scripts/check-ponytail.mjs) ONLY validates the FORMAT of
existing # ponytail: markers (ceiling + upgrade path present). It does not
scan for complexity or block anything. The Ponytail review skill flags
potential over-engineering as a PR discussion point — the reviewer decides.

When to stop here: small projects (< 10K LOC, single developer, no external
APIs, no money flows). If you have more than one agent working simultaneously,
or the codebase is growing fast, move to Tier 2.

---

## Tier 2 — Code Intelligence + Evals (recommended for growing teams)

What it is: always-on knowledge graph for agent navigation + boundary
enforcement + the eval stack. Agents stop grepping and start querying. Tests
prove quality, not just coverage.

Adds to Tier 1:

CODE GRAPH:
- Graphify (MIT, free with local Ollama backend)
  Always-on knowledge graph. 36 tree-sitter grammars + SQL schemas + docs +
  PDFs + images. PreToolUse hooks nudge agents to query the graph before
  reading source files. Confidence tags (EXTRACTED / INFERRED / AMBIGUOUS).
  PostgreSQL live introspection. Outputs: graph.json, graph.html,
  GRAPH_REPORT.md, callflow Mermaid diagrams.
  Install: uv tool install graphifyy && graphify install --project
  Scripts: scripts/check-graph-freshness.mjs (CI gate: graph not stale)

BOUNDARY ENFORCEMENT:
- Bounds (MIT, github.com/Farzin312/bounds)
  Subsystem boundary manifests. Prescriptive architectural rules enforced at
  CI. "Frontend must not import from lib/marketplace." Commands: list,
  describe, where, impact, validate, calibrate. SDD-integrated (Plan / Tasks /
  Analyze / Implement / Verify phases all consult boundaries).
  Install: pipx install git+https://github.com/Farzin312/bounds.git
  CI: bounds preflight --ci (blocking after god-node cleanup)

EVALS:
- StrykerJS (MIT) — mutation testing
  Injects artificial bugs into your code, checks if tests catch them. The
  single most important quality eval for AI-heavy codebases. A test suite
  with 90% coverage but 40% mutation score is lying.
  CI: npm run test:mutation (mutation score threshold gate)

- fast-check (MIT) — property-based testing
  Define invariants, fast-check generates hundreds of edge cases automatically.
  Catches what example-based tests miss. Works with Vitest.
  No separate CI step — integrated into the test suite.

- Golden test harness (built into Trellis)
  Per-spec locked test suites. When a spec ships, its verify.md test cases are
  frozen into a golden set. Future changes that break golden tests fail CI.
  Script: scripts/golden-tests.mjs

Tools installed: node, python (for graphify + bounds), optionally ollama.
Time to set up: `./init.sh "My Project" --with-graphify --with-bounds` — 3 minutes.
Agent benefit: agents navigate the codebase via graph queries (not grepping
3,000 files), respect architectural boundaries (no forbidden imports), and
face a test suite that actually validates behavior (not just execution).

When to stop here: most projects. Tier 3 is for projects with multiple
simultaneous agents, external API consumers, or heavy migration workloads.

---

## Tier 3 — Full Power (SDD + Handoff Loops + Migration Safety + Observability)

What it is: automatic agent-to-agent task passing, migration runtime evals,
type-safe API contracts, and agent observability. The complete system.

Adds to Tier 2:

AGENT HANDOFF LOOPS:
- .agents/handoffs/registry.yaml — specialist agents with trigger conditions
  and I/O contracts. Handoffs are tools the LLM calls to delegate mid-task.
  Three trigger types:
    (a) Explicit: agent calls handoff("security-review", context)
    (b) Implicit: PreToolUse hook detects condition (migration file created)
    (c) Phase-boundary: SDD transition triggers mandatory handoff
- Loop guards: max depth (5), max iterations (20), deadlock detection
- Git-trackable JSON files that any agent reads/writes via the mandate file.
 No external service dependency.

MIGRATION SAFETY:
- scripts/check-migration-safety.mjs — the full migration eval:
  (1) Up/down round-trip: apply migration up, snapshot schema, apply down,
      verify clean rollback
  (2) RLS check: every new table has row-level security enabled
  (3) FK delete rules: foreign key ON DELETE rules match baseline
  (4) Unique version: no duplicate migration version numbers
  (5) Data preservation: migrations altering existing data include a
      before/after snapshot test
- Graphify --postgres DSN: agents query the LIVE database schema, not just
  what migrations say. "What columns does this table actually have right now?"

TYPE SAFETY:
- Zod + tRPC — end-to-end type-safe API contracts. Eliminates "contracts.md
  is markdown" problem. Agents see type errors before runtime.

OBSERVABILITY:
- Arize Phoenix (Apache 2.0, self-hosted) — fully open-source agent tracing +
  LLM-as-judge evals. Traces every agent turn: token cost, tool calls,
  failures, time per task.

Tools installed: node, python, postgres client, docker (for Phoenix self-host).
Time to set up: 5-10 minutes (includes Phoenix docker compose).
Agent benefit: agents delegate to specialists automatically based on what they
discover. Migrations are runtime-tested, not just linted. API contracts are
enforced by the type system. You can see exactly what agents did and how long
it took.

---

## Tier Comparison

| Dimension              | Tier 1    | Tier 2                | Tier 3                          |
|------------------------|-----------|-----------------------|---------------------------------|
| SDD pipeline           | Yes       | Yes                   | Yes                             |
| Cross-tool commands    | 4 platforms | 4 platforms         | 4 platforms                     |
| Mandate file sync      | CI gate   | CI gate               | CI gate                         |
| Knowledge graph        | No        | Graphify (always-on)  | Graphify (always-on)            |
| Boundary enforcement   | No        | Bounds (CI gate)      | Bounds (CI gate)                |
| Mutation testing       | No        | StrykerJS             | StrykerJS                       |
| Property testing       | No        | fast-check            | fast-check                      |
| Golden tests           | No        | Yes                   | Yes                             |
| Agent handoff loops    | No        | No                    | Yes                             |
| Migration evals        | Lint only | Lint + RLS/FK         | Lint + RLS/FK + round-trip + data |
| Type-safe contracts    | No        | No                    | Zod + tRPC                      |
| Agent observability    | No        | No                    | Arize Phoenix (self-hosted)     |
| External dependencies  | Node      | Node + Python         | Node + Python + Docker          |
| Setup time             | 1 min     | 3 min                 | 10 min                          |

---

## Ponytail Integration (all tiers)

Ponytail is the lazy-senior-dev discipline. It is installed as a PLUGIN per
agent platform, never inlined into AGENTS.md (that bloats docs and drifts from
source). The hooks auto-inject the ruleset at session start.

Install commands (documented in docs/ponytail-setup.md):

  Claude Code:  claude plugin marketplace add DietrichGebert/ponytail
                claude plugin install ponytail@ponytail
  Codex:        codex plugin marketplace add DietrichGebert/ponytail
                codex plugin add ponytail@ponytail
  Copilot CLI:  copilot plugin marketplace add DietrichGebert/ponytail
                copilot plugin install ponytail@ponytail
  OpenCode:     (use the standalone ruleset file from the Ponytail repo)

What Trellis adds: a format-only CI check (scripts/check-ponytail.mjs) that
validates existing # ponytail: markers have a ceiling + upgrade path. It does
NOT scan for complexity, does NOT block builds, and does NOT second-guess the
developer. Ponytail is advisory; the reviewer (human or agent) is the gate.

---

## CLI Usage

Trellis ships as both a cloneable template and a CLI.

As template:
  git clone https://github.com/farzin/trellis.git my-project
  cd my-project
  ./init.sh "My Project Name" --with-graphify --with-bounds

As CLI (install Trellis globally to scaffold new projects anywhere):
  pipx install git+https://github.com/farzin/trellis.git
  trellis new my-project --tier 2
  trellis init      # run init.sh with defaults
  trellis spec      # start a new SDD spec
  trellis graph     # rebuild the Graphify knowledge graph
  trellis eval      # run the full eval suite (mutation + property + golden)
  trellis check     # run all CI checks locally

The CLI wraps the scripts/ directory. Each trellis subcommand maps to a script.
This means the CLI and the npm scripts are always in sync — no separate
codebase to maintain.

---

## Which Tier Should I Use?

- Solo dev, small project, learning the system: start Tier 1, upgrade when
  the codebase hits ~10K LOC or you add a second agent.
- Growing team, multiple agents, external APIs: Tier 2. This is the
  recommended default for any production project.
- Complex platform (marketplace, payments, multi-service): Tier 3. The
  handoff loops, migration evals, and observability pay for themselves the
  first time an agent chain catches a bad migration before prod.

You can upgrade tiers at any time by running the init script with additional
flags. No tier downgrades data — removing a tool just means its checks stop
running.
