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
| A guided installer becomes a destructive universal merger. | High | Keep plan generation read-only, require all answers and consent, and route brownfield execution through reviewed AI/human merge steps. | FR-015, SC-004, VAL-007 |
| Product tiers fragment behavior and documentation. | Medium | Ship one core and derive descriptive add-on recommendations from stated needs. | FR-015, FR-016 |
| Optional tools are enabled before their CLI, agent skill, project artifact, or CI contract is ready, or approval for one tool is reused for another. | High | Separate recommendation from enablement; require an explicit per-capability dependency policy and verify each selected tool before enabling its gate. | FR-006, FR-015, SC-003, SC-004 |
| A project aggregate recursively invokes Trellis or duplicates language suites. | High | Detect recursive wrapper paths before spawn and suppress fallback adapters when `check:project` exists. | FR-014, INV-002 |
| Clarify produces vague free-form questions or Analyze reports defects without closing them. | Medium | Require A/B/C/D choices with recommendations and require artifact repair plus a repeated Analyze gate. | FR-017, SUCCESS-005 |
| Marketing assets bloat clones, fail on GitHub, or hide essential information from assistive technology. | Medium | Bound file sizes, use supported static PNG/SVG/GIF formats, meaningful alt text, and complete adjacent prose. | FR-016, EDGE-011 |
| Repository-controlled symlinks or generated manifest traversal redirect reads, pruning, or writes outside the project. | Critical | Validate regular filesystem objects and canonical path grammar before any mutation or content output; cover nested and parent-tree symlinks with negative fixtures. | SC-001, SC-002, SC-005, VAL-008, EDGE-013 |
| A modified Compose file gains Docker authority through a trusted Trellis command. | Critical | Pin the immutable image and the complete reviewed Compose payload digest; reject drift and symlinks before invoking Docker. | SC-003, SC-005, VAL-008, SUCCESS-007 |
