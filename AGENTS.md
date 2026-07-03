# __PROJECT_NAME__ — AI Agent Mandate

> Parent: `README.md`. AI agents start at `docs/README-FOR-AGENTS.md` (routing entry-point).
> This file is the cross-tool standard. `CLAUDE.md` is a synced copy. Verify with `npm run check:mandates`.
> Supported agents: Claude Code, Codex CLI, OpenCode, GitHub Copilot.

This file is the single entry point for AI coding agents. It is a DIRECTIVE INDEX, not a knowledge base. Each section states the rule (what / never) and points to the authoritative deep doc (why / how).

## Scope

This repo owns: [describe what this project is — fill in after init].

## The 5 load-bearing rules

1. **SDD before code** — non-trivial change -> `.specify/specs/<NNN>-<slug>/` chain -> `docs/sdd/sdd.md`. No skipping gates. Each phase has a slash command on all 4 agent platforms.
2. **Code is source of truth** — when docs and code disagree, update the docs. Exception: if the code itself is contradicting (types lying about runtime, dead branches, mutually exclusive constraints), stop and surface the code concern.
3. **Doc references are part of every code change** — renaming, moving, or deleting a symbol means updating every doc reference in the same commit. `npm run docs:sync` is the safety net, not the primary mechanism.
4. **Bug fixes are categorized** — every fix gets a `docs/bug-fixes/YYYY-MM-DD-<slug>.md` entry with frontmatter (`area`, `category`, `severity`). Auto-indexed.
5. **No unrequested abstractions** (Ponytail) — start with the lazy solution. Mark deliberate simplifications with `# ponytail: <ceiling>, upgrade: <path>`. Mark deliberate expansions with `# trellis: full-impl, <reason>`. Ponytail is advisory, not a build gate.

## Code quality standard

Single source of truth: `docs/coding-standards.md`. Guard clauses, composition over inheritance, structured error handling, TypeScript discipline (no `any`), naming, state machines, custom error classes, idempotency, race-condition prevention. Every AI tool and developer applies this canon.

## Documentation structure

Single source of truth: `docs/STRUCTURE.md`. The retrieval flow is always: mandate file (this) -> system-folder README -> subsystem doc -> followed reference. Never navigate to a reference bank directly.

## Knowledge graph (Tier 2+)

If Graphify is installed, agents consult the knowledge graph BEFORE reading source files. The PreToolUse hook auto-nudges toward `graphify query "<question>"`. Use the graph for: "how does X work?", "where is Y defined?", "what depends on Z?". Fall back to source search only when the graph misses.

## Boundary enforcement (Tier 2+)

If Bounds is installed, agents consult boundaries before changing shared code. `bounds describe <subsystem>` for the public surface. `bounds impact <name>` for blast radius. `bounds validate --quick` after edits.

## Agent handoff loops (Tier 3)

If handoffs are configured (`.agents/handoffs/registry.yaml`), agents delegate to specialists mid-task. Handoffs are tools: call `handoff("<specialist>", context)` to transfer control. Three trigger types: explicit (agent calls), implicit (hook detects condition), phase-boundary (SDD transition).

## Ponytail (lazy senior dev mode)

Ponytail is installed as a PLUGIN per agent platform (see `docs/ponytail-setup.md`). It is NOT inlined here. The ruleset auto-injects at session start.

Default posture: start lazy. Stdlib first. One line over fifty. No unrequested abstractions. But ponytail is not always right — when the full implementation is needed, build it and mark with `# trellis: full-impl, <reason>`.

## Read order

1. This file (AGENTS.md)
2. `docs/README-FOR-AGENTS.md` (if you are an AI agent)
3. `docs/STRUCTURE.md` (documentation rules)
4. `docs/sdd/sdd.md` (SDD methodology)
5. `docs/coding-standards.md` (code quality canon)
6. The relevant system doc under `docs/systems/`

## Commands

- `npm run lint` — all checks (mandate sync, command sync, breadcrumbs, eslint)
- `npm run test` — full test suite (vitest)
- `npm run test:mutation` — mutation testing eval (stryker)
- `npm run docs:sync` — regenerate auto-docs + verify accuracy
- `npm run docs:check` — read-only docs verification (CI gate)
- `npm run check` — all drift checks
- `bounds validate --quick` — boundary drift check
- `graphify .` — rebuild knowledge graph
