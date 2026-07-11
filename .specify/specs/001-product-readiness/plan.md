# Plan: Product Readiness and Truthful Positioning

> Spec: 001

## Architecture

1. **Portable instruction core** — satisfy FR-004 and INV-001 with canonical Agent Skills and one compatibility mirror.
2. **Safe zero-dependency control plane** — satisfy FR-001, FR-005, SC-001, SC-002, INV-003, INV-004, and INV-005 with strict process execution, explicit scaffold ownership, and atomic creation.
3. **Evidence model** — satisfy FR-002, FR-003, FR-008, FR-009, VAL-002, and INV-002 with standard-library self-tests and one aggregate gate that reports pass, fail, warning, and skip separately.
4. **Explicit optional integrations** — satisfy FR-006 and SC-003 through configured capabilities instead of inferred tiers.
5. **Truthful adopter surface** — satisfy FR-007, FR-010, FR-011, VAL-003, and VAL-004 through one identity, a linear first-run path, tested-support labels, and audience-routed maintenance material.
6. **Cheap structural orientation** — satisfy FR-012 and VAL-005 with an on-demand standard-library map that reads manifests, top-level composition, tests, and documented systems without writing a stale cache.
7. **Atomic capability configuration** — satisfy FR-013 and VAL-006 with one strict configuration module shared by CLI management and readiness checks.

The implementation removes unsupported surfaces before adding behavior. No runtime framework, telemetry service, test framework, or schema library is required by the Trellis core.

## Contracts

See `contracts.md`.

## Data Model

The only persistent control-plane state is `.trellis/config.json`; the schema is defined in `contracts.md`. Metrics remain an optional append-only JSONL ledger with strict record validation.

## Risks

See `risks.md`.

## Test Strategy

- Standard-library integration tests execute CLI parsing, process isolation, atomic scaffolding, identity adaptation, generated-file safety, and false-success cases.
- Fixture projects cover generic, JavaScript, Python, Go, and Rust manifest detection without installing their toolchains.
- The clean-scaffold smoke test verifies the explicit payload and absence of source secrets, history, and active specs.
- Generated artifact checks compare canonical skill bytes with the Claude mirror.
- Repository-map fixtures cover excluded paths, stable ordering, JSON output, no-system projects, and paths containing spaces.
- Configuration fixtures cover valid inspection, atomic enable/disable, invalid schema, unknown values, repeated actions, and preservation of unrelated keys.
- CI installs from the lockfile and invokes only the aggregate gate.

## Complexity Tracking

- Replacing platform-specific formats with the shared Agent Skills format is a net deletion and the smallest current compatibility surface.
- Brownfield installation remains a documented, review-required merge because silently reconciling arbitrary existing mandate, package, hook, and CI files would violate SC-002 and INV-005.
- Optional third-party executables remain external; Trellis validates configured presence but does not wrap their internals.
- The core map intentionally does not parse every language's imports. Graphify owns deeper graph queries; Bounds owns enforceable subsystem boundaries.
