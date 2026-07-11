---
id: BUG-005
title: Release surfaces could report success while shipping unsafe or unusable behavior
date_fixed: 2026-07-11
severity: high
status: fixed
area: toolkit
subsystem: control-plane
category: regression
files:
  - .trellis/cli.mjs
  - .trellis/init.sh
  - .trellis/scripts/check-integrations.mjs
  - .trellis/scripts/check-docs.mjs
  - .trellis/scripts/check-mandate-sync.mjs
  - .trellis/scripts/check-migration-safety.mjs
  - .trellis/scripts/config-core.mjs
  - .trellis/scripts/evolve-skills.mjs
  - .trellis/scripts/generate-skills.mjs
  - .trellis/scripts/metrics.mjs
  - .trellis/scripts/repo-map.mjs
  - .trellis/scripts/run-evals.mjs
  - .trellis/scripts/services.mjs
  - .trellis/scripts/setup-plan.mjs
  - .trellis/scripts/wizard.mjs
  - README.md
  - CONTRIBUTING.md
  - docs/AI-SETUP.md
  - docs/manual-setup.md
  - package.json
fixed_by: Codex
---

# Product-readiness correctness fixes

> Parent: [`docs/bug-fixes/README.md`](README.md)

## Summary

The source distribution had several coupled false-success and portability
failures: shell-interpolated CLI execution, commands running in the toolkit
checkout instead of the adopter repository, denylist-based scaffolding, optional
checks counted as evidence, obsolete agent-platform mirrors, unsafe repeated
initialization, contradictory installation and licensing claims, and third-party
setup commands that did not match the installed CLIs.

The interactive wizard also displayed a default of “No” while treating a blank
answer as “Yes.” Repository discovery could descend into vendored and virtual
environment trees, project gates could be dispatched redundantly, generated
skill mirrors could hide unexpected files, and symlinked managed paths could
redirect writes. The initial guided-setup planner draft also contained a parse
error and duplicate action identifiers; focused parser tests caught both before
release.

The skill manifest pruning path trusted stored relative paths, which could let
a crafted `../` entry escape `.claude/skills/`. Docker service actions likewise
trusted a compose file by location, so a modified or symlinked payload could
reach Docker under the Trellis command's authority.

Project-gate recursion detection initially covered direct wrappers but not a
multi-script chain or a cycle between application scripts.

## Root cause

The repository grew by adding platform copies, tiers, checks, and documentation
claims independently. No single executable contract owned argument parsing,
project configuration, scaffold contents, evidence status, package contents, or
adopter-facing support claims. Compatibility paths and optional-tool commands
were assumed rather than checked against current primary documentation and
actual CLI help.

Several writers validated only content, not filesystem object type, and setup
behavior mixed displayed defaults, inferred intent, and mutation. The missing
seam was a strict separation between caller-owned answers, deterministic
planning, reviewed execution, and empirical verification.

## Fix

Trellis now uses argument-array execution, a curated atomic scaffold, one
validated atomic configuration schema, canonical `.agents/skills/` plus only the
required Claude mirror, a dependency-free structural map, explicit Graphify and
Bounds gates, and separate `PASS`, `FAIL`, `WARN`, and `SKIP` semantics. The
public package uses an allowlist, generated projects receive no Trellis release
history or root license, and the README states the actual source-distribution,
platform, Bash, brownfield, auth, and optional-integration boundaries.

The wizard now parses explicit defaults, project evaluation prefers one
non-recursive `check:project` command, structural discovery excludes generated
and vendored trees, and managed writes reject symlinked policy/config/skill
paths. Skill health validates the generated inventory while treating external
standards-compliant skills as external. Guided setup now validates a bounded,
regular, non-symlink JSON answer file and emits a stable argument-array plan
without writing anything; AI and human routes share the same approval and
verification contract.

Skill generation now validates manifest paths and canonical/mirror trees before
mutation, rejects nested symlinks, and writes its manifest exclusively and
atomically. Phoenix operations verify a regular non-symlink compose file and
the reviewed SHA-256 payload before invoking Docker.

Evaluation now traverses npm-script references from `check:project` and
`test:project`; a route to a Trellis wrapper or any reachable script cycle fails
before spawning the project command.

## Prevention

Standard-library tests cover CLI validation, repeated initialization, config
preservation, platform paths, package contents, clean scaffold installation,
integration absence and zero coverage, documentation links and claims, and
result classification. `npm run check` is the one blocking local and CI gate;
the release verification record preserves optional skips and external limits.
Planner tests require every top-level and nested answer, contradictory-value
rejection, no-write determinism, safe path syntax, and unique action IDs. Public
documentation tests also bound asset sizes, require useful alternative text and
reduced-motion media, and prevent visuals from becoming the only source of
operational truth.

## References

- Spec: 001-product-readiness
- Related bugs: BUG-001, BUG-002, BUG-003, BUG-004
