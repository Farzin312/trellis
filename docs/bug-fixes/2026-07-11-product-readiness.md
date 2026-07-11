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
  - .trellis/scripts/run-evals.mjs
  - .trellis/scripts/services.mjs
  - README.md
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

## Root cause

The repository grew by adding platform copies, tiers, checks, and documentation
claims independently. No single executable contract owned argument parsing,
project configuration, scaffold contents, evidence status, package contents, or
adopter-facing support claims. Compatibility paths and optional-tool commands
were assumed rather than checked against current primary documentation and
actual CLI help.

## Fix

Trellis now uses argument-array execution, a curated atomic scaffold, one
validated atomic configuration schema, canonical `.agents/skills/` plus only the
required Claude mirror, a dependency-free structural map, explicit Graphify and
Bounds gates, and separate `PASS`, `FAIL`, `WARN`, and `SKIP` semantics. The
public package uses an allowlist, generated projects receive no Trellis release
history or root license, and the README states the actual source-distribution,
platform, Bash, brownfield, auth, and optional-integration boundaries.

## Prevention

Standard-library tests cover CLI validation, repeated initialization, config
preservation, platform paths, package contents, clean scaffold installation,
integration absence and zero coverage, documentation links and claims, and
result classification. `npm run check` is the one blocking local and CI gate;
the release verification record preserves optional skips and external limits.

## References

- Spec: 001-product-readiness
- Related bugs: BUG-001, BUG-002, BUG-003, BUG-004
