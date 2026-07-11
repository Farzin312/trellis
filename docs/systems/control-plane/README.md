# Control plane

> Parent: [Trellis system documentation](../README.md)

## Ownership

The control plane owns validated CLI dispatch, atomic project creation,
idempotent initialization, project configuration, structural repository mapping,
skill generation, metrics display, and optional Graphify, Bounds, and Phoenix
operations.

## Public Surface

- `trellis help --ai`
- `trellis new` and `trellis init`
- `trellis map` and `trellis config`
- `trellis graph`, `trellis metrics`, and `trellis services`
- `.trellis/config.json` schema version 1

## Private internals

Scripts under `.trellis/scripts/` are implementation details except where a
package script deliberately exposes them. Callers use the CLI or `npm` scripts,
not imported script internals.

## Dependencies and dependents

The core depends on Node.js standard-library APIs, Bash for initialization, and
repository files. Optional commands depend on their explicitly configured tool.
The verification subsystem calls configuration and readiness scripts; guidance
generation reads canonical Agent Skills.

## Invariants and trust boundaries

Arguments are validated before writes or process execution. Child processes use
argument arrays. Scaffold creation publishes atomically from an allowlisted
payload, and repeated initialization preserves user-owned files.

## Failure and operation

Usage errors exit 2, operational failures exit 1, and successful work exits 0.
Optional-tool absence is a skip only when the integration is not configured.

## Verification

See `.trellis/tests/cli.test.mjs`, `config.test.mjs`, `init.test.mjs`,
`repo-map.test.mjs`, `services.test.mjs`, and `scaffold-smoke.test.mjs`.
