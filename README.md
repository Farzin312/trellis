# Trellis

```
        ╔══════════════════════════════════════════════╗
        ║                                              ║
        ║   a framework that supports AI-assisted      ║
        ║   projects as they scale                     ║
        ║                                              ║
        ║   agents climb it                            ║
        ║   specs weave through it                     ║
        ║   evals hold it taut                         ║
        ║                                              ║
        ╚══════════════════════════════════════════════╝
```

A cloneable AI-agent-ready project scaffold with code graph, boundary enforcement, evals, agent handoff loops, and a self-evolution engine. All free. All open-source. All cross-tool. Stack-agnostic.

---

## Quick Start

```bash
git clone https://github.com/Farzin312/trellis.git my-project
cd my-project
./init.sh "My Project" --with-graphify --with-bounds
```

Or use the CLI:

```bash
pipx install git+https://github.com/Farzin312/trellis.git
trellis new my-project --tier 2
```

That gives you a working AI-ready project in under 3 minutes. No manual setup of 50+ files.

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
│                                            + portable context     │
│                                            + CI-enforced doc sync │
│                                                                  │
│  Result: drift, hallucination,            Result: agents navigate │
│  broken docs, silent regressions          correctly, tests prove  │
│                                            quality, framework     │
│                                            stays fresh            │
└──────────────────────────────────────────────────────────────────┘
```

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

See **[TIERS.md](TIERS.md)** for full details.

### How to upgrade tiers

```bash
# Start at Tier 1
./init.sh "My Project"

# Upgrade to Tier 2 later
./init.sh "My Project" --with-graphify --with-bounds

# Upgrade to Tier 3
trellis evolve --all   # wire up handoffs + observability
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
└──────────┘    └──────────┘    └──────┘    └───────┘    └─────┬────┘
                                                                 │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  Verify  │◀───│ Implement│◀───│ Analyze  │◀───│  Review  │◀───┘
│          │    │          │    │          │    │          │
│ All      │    │ TDD:     │    │ Solution│    │ Catch    │
│ evals    │    │ TEST     │    │ audit   │    │ drift    │
│ run here │    │ first    │    │ (gate)  │    │          │
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

## Agent Handoff Loops

Agents don't just work in parallel — they delegate to each other mid-task:

```
Implement agent writes a migration
    │
    ├── implicit trigger: migration file created
    │
    ▼
migration-validator (specialist agent)
    │
    ├── runs up/down round-trip test
    ├── checks RLS
    ├── checks FK rules
    │
    ├── PASS → return control to Implement agent
    │
    └── FAIL → handoff to bug-hunter
                    │
                    ├── root-causes the failure
                    ├── proposes fix
                    └── returns to Implement agent
```

Three trigger types:
- **Explicit**: agent calls `handoff("security-review", context)`
- **Implicit**: PreToolUse hook detects a condition
- **Phase-boundary**: SDD transition triggers a handoff

Loop guards prevent infinite ping-pong (max depth 5, max iterations 20).

Read **[.agents/handoffs/registry.yaml](.agents/handoffs/registry.yaml)** for
all 8 specialists and their trigger rules.

---

## The Evolution Engine

Agents go stale. A constitution that says "use Supabase Auth" in a project that
migrated to Clerk is worse than no constitution.

```
Weekly cron runs Evolution Agent
    │
    ├── Stack drift: does reality match the constitution?
    ├── Tool versions: are commands using deprecated flags?
    ├── Failure patterns: are agents repeating mistakes?
    ├── Redundancy: are two agents doing the same thing?
    │
    ▼
Produces report: .agents/evolution/YYYY-MM-DD-report.md
    │
    ▼
Human reviews → SDD spec → ship change
    (Evolution NEVER auto-applies — it proposes, SDD reviews)
```

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
trellis evolve --all            # Run the full evolution audit
trellis evolve --stack          # Check for stack drift only
```

---

## Supported AI Agents

Claude Code | Codex CLI | OpenCode | GitHub Copilot

All four read AGENTS.md natively. Slash commands are mirrored to all four via
the command generator. (Gemini dropped as legacy.)

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
├── TIERS.md                      ← tier definitions
├── CREDITS.md                    ← tool credits + licenses
├── CONTRIBUTING.md               ← how to extend Trellis
├── MASTERPLAN.md                 ← internal build tracker
├── init.sh                       ← clone-and-run setup
├── cli.mjs                       ← CLI entry point
├── package.json                  ← npm scripts + dev deps
├── pyproject.toml                ← pipx CLI install
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
│   ├── evals.md                 ← complete eval guide
│   ├── evolution.md             ← self-evolution engine
│   ├── coding-standards.md      ← code quality canon
│   ├── ponytail-setup.md        ← ponytail install guide
│   └── sdd/sdd.md               ← SDD policy
│
├── .agents/                      ← agent configs
│   ├── handoffs/registry.yaml   ← 8 specialists + trigger rules
│   └── context/                 ← portable cross-session memory
│
├── .bounds/                      ← boundary enforcement config
├── .claude/                      ← Claude Code hooks + commands
├── .codex/                       ← Codex hooks + commands
├── .opencode/                    ← OpenCode commands
├── .github/                      ← Copilot + CI workflows
│
├── scripts/                      ← all automation (11 scripts)
│   ├── generate-commands.mjs    ← emit 4-platform command mirrors
│   ├── check-mandate-sync.mjs   ← AGENTS.md ↔ CLAUDE.md sync gate
│   ├── check-command-sync.mjs   ← command mirror sync gate
│   ├── check-agnostic.mjs       ← stack-agnostic enforcement
│   ├── docs-sync.mjs            ← doc accuracy pipeline
│   ├── check-migration-safety.mjs
│   ├── check-graph-freshness.mjs
│   ├── check-ponytail.mjs
│   ├── adapt-to-project.mjs     ← detect + adapt to project stack
│   ├── handoff-engine.mjs       ← validate/replay handoff registry
│   └── run-evals.mjs            ← full eval suite runner
│
tests/golden/                 ← per-spec locked suites (created by project)
└── docker-compose.phoenix.yml    ← Arize Phoenix self-hosted
```

---

## Origin

Trellis distills patterns refined through extensive production use across
multiple fullstack projects — documentation structures, SDD pipelines,
boundary enforcement, and eval systems that proved their value at scale.

---

## License

MIT. Use it, fork it, modify it, sell it. No attribution required.
