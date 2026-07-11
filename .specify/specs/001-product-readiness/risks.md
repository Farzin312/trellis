# Risks: Product Readiness and Truthful Positioning

> Spec: 001

| Risk | Severity | Mitigation | Refs |
|---|---|---|---|
| Legacy generated paths remain discoverable and conflict with canonical skills. | High | Remove only known Trellis-owned mirrors; preserve unrelated user files. | FR-004, SC-002, INV-001 |
| Strict validation breaks scripts that relied on silent defaults. | Medium | Use exit `2`, concise usage, and migration notes; keep documented option spellings. | VAL-001 |
| A failed scaffold leaves user-visible partial state. | High | Create in a sibling temporary directory and rename only after initialization succeeds. | INV-004, EDGE-004 |
| Optional installer failure mutates global tool state before project creation fails. | Medium | Preflight first, pin versions, report the external side effect, and keep optional installation explicit. | SC-003, EDGE-002 |
| Platform behavior changes after this dated compatibility review. | Medium | Prefer the shared Agent Skills standard, cite official paths, and keep compatibility claims scoped and dated. | FR-004, FR-007 |
| Cross-language eval commands run where the toolchain is absent. | Medium | Detect manifests and test files separately; configured evidence fails actionably, absent optional evidence skips explicitly. | FR-002, FR-006, EDGE-002, EDGE-005 |
| Documentation is mechanically valid but semantically false. | High | Add claim-focused self-tests for commands, identity, paths, and summaries; remove outcome guarantees not executable as tests. | FR-007, FR-010, VAL-002 |
| Brownfield automation overwrites existing policies or CI. | High | Do not auto-merge arbitrary repositories; provide a review-required adoption checklist. | SC-002, INV-005 |
| Removing tiers appears to reduce capability. | Low | Present optional integrations directly and tie each to a concrete need and prerequisite. | FR-006, FR-011 |
| MIT and optional integration licenses are conflated. | High | State Trellis and third-party licenses separately and retain required notices. | FR-007, VAL-004 |
