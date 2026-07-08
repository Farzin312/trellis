# Trellis

```
        ╔══════════════════════════════════════════════╗
        ║                                              ║
        ║   ship faster with LLMs                      ║
        ║   without the drift and cost blowup          ║
        ║                                              ║
        ║   agents climb it                            ║
        ║   specs weave through it                     ║
        ║   evals hold it taut                         ║
        ║                                              ║
        ╚══════════════════════════════════════════════╝
```

One clone makes any repo AI-agent-ready across 4 tools (Claude Code, Codex CLI,
OpenCode, Copilot). Spec-driven development, knowledge graph, boundary
enforcement, mutation evals, agent handoff loops, and cost-per-agent metrics.
All free. All open-source. Stack-agnostic.

---

## Quick Start

```bash
git clone https://github.com/Farzin312/trellis.git my-project
cd my-project

# All 4 agents (default)
./.trellis/init.sh "My Project"

# Or pick your agents
./.trellis/init.sh "My Project" --agents=claude,copilot
```

Available `--agents` values: `claude`, `codex`, `opencode`, `copilot`.

Which agents are you using?

| Agent | Why |
|-------|-----|
| Claude Code | Full IDE integration, subagents, best for complex work |
| Codex CLI | Quick one-shot code generation |
| OpenCode | Open-source, terminal-native |
| GitHub Copilot | Deep GitHub integration |

You don't need all four. Pick the ones you use. Skills, commands, and
mandate files only mirror to your chosen platforms. Change later by
editing `.trellis/config.json` and running `node .trellis/scripts/generate-skills.mjs`.

### Two ways to start (what you actually get)

- **Use it** — `trellis new <name>` (or download the ZIP + `./.trellis/init.sh`). You get a
  **clean scaffold**: dev-only files (like the build `WORKPLAN.md`) are stripped via
  `export-ignore` / the `new` copy filter. Your tree is your project, not the Trellis repo.
- **Contribute to Trellis** — `git clone` the full repo; you get everything, including
  the dev scaffolding.

---

## What Problem Does Trellis Solve?

Most "AI-ready" repos are just an AGENTS.md file. That gets you 10% of the way:

```
┌──────────────────────────────────────────────────────────────────┐
│  WITHOUT TRELLIS                          WITH TRELLIS            │
│                                                                  │
│  AGENTS.md (1 file)                       + SDD pipeline          │
│                                            + code knowledge graph │
│  Agent: "where is X?"                     + boundary enforcement  │
│  → greps 3000 files                       + mutation evals        │
│  → reads wrong file                       + property tests        │
│  → hallucinates pattern                   + golden test suites    │
│  → introduces forbidden import            + agent handoff loops   │
│  → writes code that "looks right"         + migration safety evals│
│  → test passes but logic is wrong         + self-evolution engine │
│  → no idea how many tokens it burned      + portable context     │
│                                            + CI-enforced doc sync │
│                                            + cost-per-agent ledger│
│  Result: drift, hallucination,            Result: agents navigate │
│  broken docs, silent regressions,         correctly, tests prove  │
│  runaway token cost, no accountability    quality, framework     │
│                                            stays fresh, cost is   │
│                                            visible and auditable  │
└──────────────────────────────────────────────────────────────────┘
```

### The five failure modes Trellis kills

| Failure mode | What happens without Trellis | Trellis mechanism |
|---|---|---|
| **Context drift** | Agent greps the whole repo, reads wrong files, hallucinates patterns | Knowledge graph (`graphify query`), portable context files |
| **Forbidden imports** | Agent introduces cross-boundary deps, breaks subsystem isolation | Boundary enforcement (`bounds validate`), agnostic gate |
| **Silent regressions** | Tests pass but logic is wrong; mutation score is 0% | Mutation evals (StrykerJS/mutmut), golden test suites |
| **Doc/code drift** | Docs reference symbols that were renamed or deleted | CI-enforced doc sync, breadcrumb checks |
| **Runaway token cost** | No visibility into what each agent turn costs | Cost-per-agent ledger (`trellis metrics`), pricing table |

### How Trellis compares

| Capability | Raw LLM agent | Just an AGENTS.md | Trellis |
|---|---|---|---|
| Agent reads project rules | No | Yes (1 file) | Yes (mandate + skills + commands) |
| Code navigation | grep / guess | grep / guess | Knowledge graph (structured queries) |
| Boundary enforcement | None | None | `bounds validate` in CI |
| Spec-driven workflow | None | Mentioned | 9-phase SDD pipeline with slash commands |
| Mutation testing | Manual | Manual | Built-in config + runner |
| Golden test suites | Manual | Manual | Freeze-on-ship + regression gate |
| Agent handoff contracts | None | None | Registry with input/output contracts |
| Migration safety | Manual | Manual | Static analysis (RLS, FK, versioning) |
| Doc/code sync | Manual | Manual | CI-enforced breadcrumbs + auto-sync |
| Cost visibility | None | None | `trellis metrics` (per-agent, per-phase) |
| Cross-tool support | One tool | One tool | 4 tools (Claude, Codex, OpenCode, Copilot) |
| Stack-agnostic | N/A | Partial | Yes (JS/TS, Python, Go, Rust, generic) |

---

## How It Works (The Big Picture)

```
                    ┌─────────────────────────────────┐
                    │         YOU / YOUR TEAM          │
                    │      (human or AI agent)         │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │        AGENTS.md / CLAUDE.md      │
                    │     (cross-tool mandate file)     │
                    │   Claude Code | Codex | OpenCode  │
                    │           | Copilot                │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
   ┌──────────▼─────┐  ┌────────▼────────┐  ┌──────▼──────────┐
   │  SDD PIPELINE  │  │  CODE GRAPH     │  │  HANDOFF LOOPS  │
   │                │  │  (Graphify)     │  │                 │
   │  Specify       │  │                 │  │  Agent A        │
   │  → Clarify     │  │  Always-on      │  │    ↓ handoff()  │
   │  → Plan        │  │  query before   │  │  Agent B        │
   │  → Tasks       │  │  reading files  │  │    ↓ return     │
   │  → Analyze     │  │                 │  │  Agent A        │
   │  → Implement   │  │  Confidence     │  │                 │
   │  → Verify      │  │  tags           │  │  Auto-triggered │
   │                │  └─────────────────┘  └─────────────────┘
   └───────┬────────┘
           │
     ┌─────▼──────────────────────────────────────────────┐
     │                  EVAL SYSTEM                         │
     │                                                     │
     │  StrykerJS    fast-check    Golden tests   Phoenix  │
     │  (mutation)   (property)    (regression)   (trace)  │
     └─────┬───────────────────────────────────────────────┘
           │
     ┌─────▼──────────────────────────────────────────────┐
     │              BOUNDARY ENFORCEMENT                    │
     │                  (Bounds)                            │
     │  "Frontend must NOT import from lib/marketplace"    │
     └─────┬───────────────────────────────────────────────┘
           │
     ┌─────▼──────────────────────────────────────────────┐
     │            EVOLUTION ENGINE                         │
     │  Audits agents weekly: is the constitution still    │
     │  accurate? Are tools updated? Are patterns stale?   │
     │  Proposes changes through SDD review.               │
     └────────────────────────────────────────────────────┘
```

---

## Tiers

Not everyone needs everything on day one.

| Tier | What you get | Setup | When to use |
|------|-------------|-------|-------------|
| **1 - Core** | SDD pipeline + mandate sync + docs structure + ponytail | 1 min | Small projects, learning |
| **2 - Intelligence** | + Graphify graph + Bounds + StrykerJS + fast-check | 3 min | Growing teams (recommended) |
| **3 - Full Power** | + Handoff loops + migration evals + Zod/tRPC + Phoenix | 10 min | Complex platforms |

### Tier comparison

| Dimension              | Tier 1    | Tier 2                | Tier 3                            |
|------------------------|-----------|-----------------------|-----------------------------------|
| SDD pipeline           | Yes       | Yes                   | Yes                               |
| Cross-tool commands    | 4 platforms | 4 platforms         | 4 platforms                       |
| Mandate file sync      | CI gate   | CI gate               | CI gate                           |
| Knowledge graph        | No        | Graphify (always-on)  | Graphify (always-on)              |
| Boundary enforcement   | No        | Bounds (CI gate)      | Bounds (CI gate)                  |
| Mutation testing       | No        | StrykerJS             | StrykerJS                         |
| Property testing       | No        | fast-check            | fast-check                        |
| Golden tests           | No        | Yes                   | Yes                               |
| Agent handoff loops    | No        | No                    | Yes                               |
| Migration evals        | Lint only | Lint + RLS/FK         | Lint + RLS/FK + round-trip + data |
| Type-safe contracts    | No        | No                    | Zod + tRPC                        |
| Agent observability    | No        | No                    | Arize Phoenix (self-hosted)       |
| External dependencies  | Node      | Node + Python         | Node + Python + Docker            |
| Setup time             | 1 min     | 3 min                 | 10 min                            |

### Which tier should I use?

- **Solo dev, small project, learning the system:** start Tier 1, upgrade when
  the codebase hits ~10K LOC or you add a second agent.
- **Growing team, multiple agents, external APIs:** Tier 2. This is the
  recommended default for any production project.
- **Complex platform (marketplace, payments, multi-service):** Tier 3. The
  handoff loops, migration evals, and observability pay for themselves the
  first time an agent chain catches a bad migration before prod.

You can upgrade tiers at any time by running the init script with additional
flags. No tier downgrades data — removing a tool just means its checks stop
running.

See [docs/credits.md](docs/credits.md) for tool licenses and attributions.

### How to upgrade tiers

```bash
# Start at Tier 1
./.trellis/init.sh "My Project"

# Upgrade to Tier 2 later
./.trellis/init.sh "My Project" --with-graphify --with-bounds

# Re-adapt after upgrading (stack + skill health)
trellis evolve --all
```

---

## Stack-Agnostic: Works With Any Project

Trellis does NOT assume Next.js, Supabase, React, or any specific stack. During
init, it detects your stack and adapts:

```
init.sh runs
    │
    ├── Detects: package.json? → Next.js, React, Supabase, Stripe...
    ├── Detects: requirements.txt? → FastAPI, Flask, Django...
    ├── Detects: go.mod? → Go + Gin/Echo
    ├── Detects: Cargo.toml? → Rust + Axum/Actix
    ├── Detects: none of the above? → generic project
    │
    ▼
Adapts constitution:
    ├── Has React/Next? → keep "Server Components First"
    ├── No UI framework? → replace with "Simplicity First"
    ├── Has Supabase? → keep "Auth truth is Supabase Auth"
    ├── No auth provider? → make generic
    └── All framework principles (SDD, evals, docs) stay untouched
```

This means a Rust CLI, a Python data pipeline, a Go microservice, and a
Next.js marketplace all start from the same clone. Read **[docs/DESIGN.md](docs/DESIGN.md)**
for the full philosophy.

---

## The SDD Pipeline (Spec-Driven Development)

```
┌──────────┐    ┌──────────┐    ┌──────┐    ┌───────┐    ┌──────────┐
│ Specify  │───▶│ Clarify  │───▶│ Plan │───▶│ Tasks │───▶│Checklist │
│          │    │          │    │      │    │       │    │          │
│ What and │    │ Ask      │    │ Arch,│    │ Atomic│    │ Validate │
│ why      │    │ questions│    │ risks│    │ tasks │    │ spec     │
└──────────┘    └──────────┘    └──────┘    └───────┘    └────┬─────┘
                                                                │
┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  Verify  │◀───│ Implement│◀───│ Analyze  │◀───┌──────────┐    │
│          │    │          │    │          │    │  Review  │◀───┘
│ All      │    │ TDD:     │    │ Solution│    │          │
│ evals    │    │ TEST     │    │ audit   │    │ Catch    │
│ run here │    │ first    │    │ (gate)  │    │ drift    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

Write a spec once. Run it through any AI agent. The slash commands exist on all
4 platforms, generated from a single source.

```bash
# Start a new feature spec
/specify "Add a password reset flow"

# The pipeline drives you through each phase
/clarify → /plan → /tasks → /checklist → /analyze → /implement → /review → /verify
```

Every phase has a source file in `.specify/templates/commands/`. A generator
emits mirrors to all 4 platforms. A CI gate verifies they stay in sync.

---

## The Eval System

Evals prove code actually works, not just that it executes.

### Level 1: Code Quality

**StrykerJS (mutation testing)** — injects bugs, checks if tests catch them:

```
Your code:      return age >= 18
Your test:      expect(isAdult(18)).toBe(true)

Stryker mutates: return age > 18     ← changed >= to >
Test result:    still passes!        ← test doesn't verify the boundary

Mutation score: 0% for this function
```

**fast-check (property testing)** — you write invariants, it generates edge cases:

```typescript
it('cart total is never negative', () => {
  fc.assert(fc.property(fc.array(fc.integer()), (prices) => {
    expect(calculateCartTotal(prices)).toBeGreaterThanOrEqual(0);
  }));
});
// fast-check tests with empty arrays, huge numbers, negatives — automatically
```

### Level 2: Regression Prevention

**Golden tests** — when a spec ships, its tests freeze. Breaking them later
fails CI.

### Level 3: Agent Quality

**Arize Phoenix** (self-hosted) — traces every agent turn: token cost, tool
calls, failures, time per task.

### Level 4: Framework Health

6 CI checks enforce framework integrity: stack-agnostic, mandate sync, command
sync, graph freshness, migration safety, ponytail markers.

Read **[docs/evals.md](docs/evals.md)** for the complete guide with examples.

---

## Agent Delegation (Specialist Routing)

Agents don't just work in parallel — they delegate to specialists based on
file patterns and task type. A static delegation matrix in AGENTS.md routes
work deterministically:

```
Implement phase: task touches app/api/**
    │
    ├── Delegation matrix says: route to api-routes skill
    │
    ▼
api-routes specialist (isolated context)
    │
    ├── Receives: Task ID + file paths + FR refs ONLY
    ├── Never receives: full artifact chain or conversation history
    │
    ├── Implements the route (8-step discipline)
    │
    └── Returns compact summary to orchestrator
```

Three design principles:
- **Static routing** — the matrix is a table in AGENTS.md, not a dynamic
  engine. Deterministic, zero-token overhead.
- **Context isolation** — sub-agents receive only what they need (~200
  tokens), not the full conversation (~20K tokens).
- **Verifier != executor** — the agent that writes code never reviews it.
  Fresh sub-agent for review = unbiased verification.

Read **[docs/README-FOR-AGENTS.md](docs/README-FOR-AGENTS.md)** for the
full delegation matrix and context isolation rules.

---

## Self-Growing Skills

Skills are not static. They grow when agents discover patterns, and they
improve when existing instructions fail in practice.

```
Agent completes 3+ similar tasks
    │
    ├── No existing skill covers this
    │
    ▼
Create .trellis/agents/skills/<name>/SKILL.md
    │
    ├── Run: node .trellis/scripts/generate-skills.mjs
    │   (mirrors to Claude Code, Codex, OpenCode, Copilot)
    │
    └── Add to delegation matrix in AGENTS.md
```

When a skill's instructions are wrong or incomplete, any agent fixes them
and bumps the version. The deterministic health check
(`.trellis/scripts/evolve-skills.mjs`) verifies skill integrity in CI.

Read **[docs/evolution.md](docs/evolution.md)** for the full system.

---

## CLI Reference

```bash
trellis new <name> [--tier N]   # Scaffold a new project (default: tier 2)
trellis init                    # Run init.sh with defaults
trellis spec                    # Start a new SDD spec
trellis graph                   # Rebuild the Graphify knowledge graph
trellis eval                    # Run the full eval suite
trellis check                   # Run all CI checks locally
trellis handoffs list           # List configured handoff specialists
trellis handoffs validate       # Validate the handoff registry
trellis evolve                  # Re-adapt the framework to the current stack
trellis evolve --all            # Re-adapt + run skill-health checks
trellis evolve --stack=<x>      # Adapt to an explicit stack (e.g. nextjs,supabase)
```

---

## Supported AI Agents

Claude Code | Codex CLI | OpenCode | GitHub Copilot

All four read AGENTS.md natively. Slash commands are mirrored to all four via
the command generator.

---

## Ponytail Integration

Ponytail (by Dietrich Gebert) prevents over-engineering. It is a DEFAULT
POSTURE, not a hard gate:

```
Start lazy:
    ├── Does this need to exist? (YAGNI)
    ├── Stdlib does it?
    ├── Already-installed dependency solves it?
    ├── Can it be one line?
    └── Then: minimum code that works

But ponytail isn't always right:
    ├── Stdlib has bugs
    ├── One-liners hide edge cases
    └── Some abstractions are needed

Mark your decisions:
    # ponytail: <ceiling>, upgrade: <path>   ← deliberate simplification
    # trellis: full-impl, <reason>           ← deliberate expansion
```

CI validates marker FORMAT only. It never blocks builds. The reviewer decides.
Read **[docs/ponytail-setup.md](docs/ponytail-setup.md)** for install commands.

---

## Project Structure

```
trellis/
├── AGENTS.md                     ← cross-tool mandate (THE entry point)
├── CLAUDE.md                     ← synced copy for Claude Code
├── README.md                     ← you are here
├── package.json                  ← npm scripts + dev deps + `trellis` bin
│
├── .specify/                     ← SDD pipeline
│   ├── memory/constitution.md   ← 11 constitutional principles
│   └── templates/
│       ├── commands/            ← SDD phase sources (single source of truth)
│       ├── spec-template.md
│       ├── plan-template.md
│       └── tasks-template.md
│
├── docs/                         ← documentation
│   ├── README.md                ← human entry point
│   ├── README-FOR-AGENTS.md     ← AI agent entry point
│   ├── STRUCTURE.md             ← doc rules
│   ├── DESIGN.md                ← stack-agnostic philosophy
│   ├── credits.md               ← tool credits + licenses
│   ├── contributing.md          ← how to extend Trellis
│   ├── evals.md                 ← complete eval guide
│   ├── metrics.md               ← token cost & per-agent metrics
│   ├── evolution.md             ← self-evolution engine
│   ├── coding-standards.md      ← code quality canon
│   ├── ponytail-setup.md        ← ponytail install guide
│   └── sdd/sdd.md               ← SDD policy
│
├── .trellis/                     ← Trellis internals (scripts, agents, templates)
│   ├── scripts/                  ← all automation (18 scripts)
│   │   ├── wizard.mjs            ← interactive install wizard
│   │   ├── generate-commands.mjs ← emit 4-platform command mirrors
│   │   ├── check-mandate-sync.mjs← AGENTS.md ↔ CLAUDE.md sync gate
│   │   ├── check-command-sync.mjs← command mirror sync gate
│   │   ├── check-agnostic.mjs    ← stack-agnostic enforcement
│   │   ├── docs-sync.mjs         ← doc accuracy pipeline
│   │   ├── check-migration-safety.mjs
│   │   ├── check-graph-freshness.mjs
│   │   ├── check-ponytail.mjs
│   │   ├── adapt-to-project.mjs  ← detect + adapt to project stack
│   │   ├── handoff-engine.mjs    ← validate/list handoff registry
│   │   └── run-evals.mjs         ← full eval suite runner
│   ├── agents/                   ← agent configs (source of truth)
│   │   ├── handoffs/registry.yaml← 10 specialists + trigger rules
│   │   ├── context/              ← portable cross-session memory
│   │   └── skills/               ← SKILL.md sources (mirrored to platforms)
│   ├── templates/                ← per-stack config templates (copied by init.sh)
│   │   ├── js-ts/                ← vitest + stryker configs
│   │   ├── python/               ← pytest + mutmut configs
│   │   ├── go/                   ← go test + go-mutesting docs
│   │   └── rust/                 ← cargo test + cargo-mutants docs
│   ├── tests/golden/             ← per-spec locked suites (created by project)
│   ├── services/                 ← Docker compose files
│   │   └── docker-compose.phoenix.yml ← Arize Phoenix (observability)
│   ├── cli.mjs                   ← trellis CLI entry point
│   └── init.sh                   ← bootstrap script
│
├── .bounds/                      ← boundary enforcement config
├── .claude/                      ← Claude Code hooks + commands
├── .codex/                       ← Codex hooks + commands
├── .opencode/                    ← OpenCode commands
├── .github/                      ← Copilot + CI workflows
└── .specify/                     ← SDD spec templates + commands
```

---

## Origin

Trellis distills patterns refined through extensive production use across
multiple fullstack projects — documentation structures, SDD pipelines,
boundary enforcement, and eval systems that proved their value at scale.

---

## License

MIT. Use it, fork it, modify it, sell it. No attribution required.
