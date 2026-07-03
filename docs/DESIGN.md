# Trellis Design Philosophy

> Parent: `docs/README.md`

This document defines the core design principles that make Trellis work for
ANY project, not just one stack. It is the reference a reviewer checks against
when evaluating whether a change keeps the framework agnostic.

---

## Principle 1 — Stack-Agnostic by Construction

Trellis never assumes a specific framework, database, payment provider, or
frontend runtime. The framework skeleton works for:

- Next.js, Remix, Astro, SvelteKit, Nuxt, or plain Express
- PostgreSQL/Supabase, MySQL/PlanetScale, SQLite/Turso, MongoDB
- Stripe, Square, PayPal, Lemon Squeezy, or no payments at all
- React, Vue, Svelte, Solid, or no UI framework at all
- TypeScript, Python, Go, Rust, or mixed-language monorepos

The SDD pipeline, mandate file pattern, documentation rules, handoff loops,
eval system, and boundary enforcement are all independent of the target stack.

### How this is enforced

Every framework file (scripts, templates, docs, configs) is checked by
`scripts/check-agnostic.mjs`. This script scans for stack-specific identifiers
and flags any that appear in framework-core files. The allowlist lives at
`scripts/agnostic-allowlist.json` — files listed there are explicitly permitted
to reference specific stacks (e.g., the `.env.example` template, which shows
Supabase as an EXAMPLE).

Files that MUST stay agnostic:
- `AGENTS.md`, `CLAUDE.md` (mandate files)
- `docs/STRUCTURE.md`, `docs/coding-standards.md`, `docs/sdd/sdd.md`
- `docs/README-FOR-AGENTS.md`, `docs/README.md`
- `.specify/memory/constitution.md`
- All scripts under `scripts/` (except stack-specific helpers)
- `.agents/handoffs/registry.yaml`
- `README.md`, this file

Files that MAY reference specific stacks:
- `.env.example` (shows examples, clearly marked)
- `docs/ponytail-setup.md` (references the Ponytail project by name)
- `docs/credits.md` (names every tool we use)
- `docker-compose.phoenix.yml` at root (names Phoenix image)
- User project code (app/, lib/, etc. — not framework files)

---

## Principle 2 — Moldable to the Project Premise

When a project clones Trellis, init.sh asks (or infers) the project's premise:
what it does, what stack it uses, what constraints matter. The constitution,
coding standards, and mandate file are then ADAPTED — not rewritten from
scratch.

The adaptation is done by `scripts/adapt-to-project.mjs` (runs during init).
It:
1. Detects the stack from package.json, requirements.txt, go.mod, Cargo.toml.
2. Updates constitution Principle I (Server Components First) to match the
   rendering model (or removes it for non-UI projects).
3. Updates constitution Principle II (Auth/Money Fail-Closed) with the
   project's actual auth and payment providers (or removes money if N/A).
4. Updates the .env.example with the project's actual service keys.
5. Leaves all framework principles (SDD, docs contract, file decomposition,
   observability, TDD, handoff loops, evals) untouched — those are universal.

This means a Rust CLI project, a Python data pipeline, a Go microservice, and
a Next.js marketplace all start from the same Trellis clone but get a
constitution tuned to their reality.

---

## Principle 3 — Ever-Evolving Agents

Agents are not static. As the project grows, the tools improve, the team
learns, and the AI landscape shifts, the agent configurations (mandate files,
skills, handoff registry, command prompts) must evolve. Stale agents are a
liability — they enforce yesterday's rules against today's code.

Trellis includes an Evolution Agent (see `docs/evolution.md`) that periodically
audits the agent configurations against:
- The current codebase (has the stack drifted from what the constitution says?)
- The current tool versions (are commands using deprecated flags?)
- The current AI landscape (are there better tools or patterns now?)
- Recent failures (are agents repeatedly making mistakes the rules don't catch?)

The Evolution Agent proposes updates; it does not auto-apply them. Every
proposed change goes through SDD review (the framework reviews itself).

---

## Principle 4 — The Review Catches Opinionation

Every PR to the Trellis framework itself (not user projects) must pass:
1. `scripts/check-agnostic.mjs` — flags stack-specific coupling in framework files.
2. `npm run docs:check` — flags broken or missing cross-references.
3. The review command's agnostic checklist (see `.specify/templates/commands/review.md`).

A PR that hardcodes "Supabase" into AGENTS.md, or "React" into coding-standards
without marking it as an example, is REJECTED. The framework serves all stacks;
opinionation belongs in the adapted constitution, not the framework core.

---

## Principle 5 — The Framework Reviews Itself

Trellis's own verify.md (see `MASTERPLAN.md`) runs the framework's checks
against the framework. If check-agnostic.mjs flags Trellis's own files, that
is a build failure. If docs:check finds a broken link in Trellis's own docs,
that is a build failure. The framework is its own first customer.

---

## What Stays Universal (Never Adapted Away)

These are the load-bearing constants. No matter what the project is, these
hold:

1. **SDD before code** — non-trivial changes go through the spec pipeline.
2. **Code is source of truth** — docs follow code unless code is contradicting.
3. **Doc references update with every code change** — same commit.
4. **Bug fixes are categorized** — every fix gets a structured entry.
5. **Lazy by default (Ponytail)** — start simple, mark deviations.
6. **TDD** — tests first, run to failure, then pass.
7. **File decomposition** — 400 warn, 600 plan, 800 decompose.
8. **Observability** — structured logging, request-level metrics.
9. **Eval system** — mutation tests, property tests, golden tests prove quality.
10. **Boundary enforcement** — architectural rules are prescriptive and CI-gated.
11. **Knowledge graph** — agents navigate via queries, not grepping.
12. **Handoff loops** — agents delegate to specialists based on triggers.
13. **Evolution** — the framework and its agents update themselves periodically.

These 13 constants are why Trellis is a framework, not a boilerplate.
