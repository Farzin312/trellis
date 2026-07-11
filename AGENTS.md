# Trellis — AI agent mandate

> Parent: [README](./README.md). Agent routing starts at
> [docs/README-FOR-AGENTS.md](./docs/README-FOR-AGENTS.md).

This file is the canonical cross-agent directive index. `CLAUDE.md` imports it;
reusable workflows live in `.agents/skills/` and are mirrored only to
`.claude/skills/`.

## Scope

<!-- trellis:scope:start -->
This repo owns Trellis: a dependency-free, repository-local toolkit for agent
guidance, spec-driven delivery, and deterministic verification.
<!-- trellis:scope:end -->

Trellis does not configure application authentication, authorization, payment
state, secrets, database policy, or deployment. Those trust boundaries remain
project-owned and must fail closed.

## Load-bearing rules

1. **Use SDD before non-trivial code.** Follow
   `Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify`
   and keep the artifact chain under `.specify/specs/<NNN>-<slug>/`.
2. **Treat runtime behavior as the current truth.** If living docs disagree with
   coherent code, update the docs in the same change. If runtime behavior is
   internally contradictory or unsafe, surface and fix the code concern.
3. **Update references with symbols.** A rename, move, or deletion includes all
   affected docs, skills, scripts, tests, and examples.
4. **Record meaningful fixes.** Behavior, reliability, security, and user-facing
   regressions get a dated entry in `docs/bug-fixes/`; typos and prose-only
   cleanup do not need one.
5. **Prefer the smallest sufficient implementation.** Use platform and standard
   library capabilities before dependencies or speculative abstractions.

A change is trivial only when it is behavior-neutral and confined to one file,
such as a typo, comment, or formatting correction. Behavior changes, multi-file
changes, new public surfaces, and security-sensitive work use the full SDD flow.

## Work routing

Read the relevant `SKILL.md` before acting on a matching surface:

| Surface or phase | Skill |
|---|---|
| End-to-end non-trivial change | `sdd` |
| API or route contract | `api-routes` |
| Database schema or migration | `db-migrations` |
| Frontend component or page | `frontend-ui` |
| Documentation | `docs-maintenance` |
| Auth, permissions, money, or user data | `security-review` |
| Post-implementation simplicity review | `ponytail-review` |
| Final empirical gate | `quality-gates` |

When delegating, pass only the task ID, target paths, done condition, and
requirement references. Respect subsystem public/private boundaries and block
upward, sibling-crossing, or circular imports.

## Read order

1. `AGENTS.md`
2. `docs/README-FOR-AGENTS.md`
3. `docs/STRUCTURE.md`
4. `docs/sdd/sdd.md`
5. `docs/coding-standards.md`
6. The relevant system document under `docs/systems/`

## Optional integrations

Use Graphify only when listed in `.trellis/config.json`; query it before broad
source discovery and fall back to `rg` when it misses. Use Bounds only when
configured; inspect impact before shared-code changes and validate afterward.
Phoenix is an explicit local service, not part of core verification.

## Verification commands

- `npm run check` — the single aggregate repository gate
- `npm test` — toolkit self-tests plus configured project-test dispatch
- `npm run docs:check` — read-only breadcrumb and local-link validation
- `npm run skills:generate` — update the Claude compatibility mirror
- `npm run skills:health` — validate canonical skills and mirror parity
- `npm run metrics` — summarize only provider-supplied local metrics

Use `trellis help --ai` or `TRELLIS_AI=1` for the terse executable command
contract. Never describe `SKIP` or `WARN` as passed evidence.
