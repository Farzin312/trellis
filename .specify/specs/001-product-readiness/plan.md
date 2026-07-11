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
8. **One project-owned evidence hook** — satisfy FR-014 with a preferred `check:project` npm script that runs once and suppresses duplicate fallback adapters while retaining `test:project` compatibility.
9. **Guided adoption contract** — satisfy FR-015, SC-004, and VAL-007 with a read-only questionnaire/plan module, a CLI surface, a bundled setup Agent Skill, and AI/human guides. Plans recommend one core plus need-based add-ons; they never auto-merge brownfield policy or install global tools.
10. **Phase-quality hardening** — satisfy FR-017 with option-formatted Clarify behavior, repair-and-rerun Analyze behavior, and complete phase evidence templates.
11. **Accessible launch surface** — satisfy FR-016 with a compact project mark, static explanatory diagrams, truthful badges, alt text, and a README whose text remains complete without images. GitHub does not execute SVG animation, so motion is limited to an optional optimized GIF only when it materially demonstrates the CLI.
12. **Repository trust-boundary preflight** — satisfy SC-005 and VAL-008 by
    treating repository manifests and managed paths as untrusted input: reject
    symlinks and traversal before mutation or disclosure, bound parsed files,
    and authenticate the exact Compose payload before Docker execution.

The implementation removes unsupported surfaces before adding behavior. No runtime framework, telemetry service, test framework, or schema library is required by the Trellis core.

## Contracts

See `contracts.md`.

## Data Model

The only required persistent control-plane state is `.trellis/config.json`; the schema is defined in `contracts.md`. Metrics remain an optional append-only JSONL ledger with strict record validation. Guided setup answer files are caller-owned transient input and are never created or retained by Trellis.

## Risks

See `risks.md`.

## Test Strategy

- Standard-library integration tests execute CLI parsing, process isolation, atomic scaffolding, identity adaptation, generated-file safety, and false-success cases.
- Fixture projects cover generic, JavaScript, Python, Go, and Rust manifest detection without installing their toolchains.
- The clean-scaffold smoke test verifies the explicit payload and absence of source secrets, history, and active specs.
- Generated artifact checks compare canonical skill bytes with the Claude mirror.
- Repository-map fixtures cover excluded paths, stable ordering, JSON output, no-system projects, and paths containing spaces.
- Configuration fixtures cover valid inspection, atomic enable/disable, invalid schema, unknown values, repeated actions, and preservation of unrelated keys.
- Setup fixtures cover every missing/invalid answer, stable human/JSON plans,
  no-write behavior, profiles, per-capability dependency policy, and mixed
  already-installed/install-approved cases.
- SDD fixtures assert A/B/C/D clarification options, repair-and-rerun analysis, and the full phase-template inventory.
- README checks validate asset existence, size, alt text, fallback prose, and consistency with executable commands.
- Adversarial fixtures place traversal in generated manifests, symlinks at
  mutation and read boundaries, and drift in the Compose payload; every case
  must fail before the outside target or external command is touched.
- CI installs from the lockfile and invokes only the aggregate gate.

## Complexity Tracking

- Replacing platform-specific formats with the shared Agent Skills format is a net deletion and the smallest current compatibility surface.
- Brownfield installation remains a documented, review-required merge because silently reconciling arbitrary existing mandate, package, hook, and CI files would violate SC-002 and INV-005.
- Optional third-party executables remain external; Trellis validates configured presence but does not wrap their internals.
- The core map intentionally does not parse every language's imports. Graphify owns deeper graph queries; Bounds owns enforceable subsystem boundaries.
- Guided setup shares one answer schema and plan renderer; it does not introduce an installer framework or package editions.
- Visuals are checked-in, bounded assets. Essential information remains text, and SVGs remain static because GitHub does not support inline SVG animation.
