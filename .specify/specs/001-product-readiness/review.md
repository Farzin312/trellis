# Review: Product Readiness and Truthful Positioning

> Spec: 001
> Result: PASS

## Findings

| Severity | Path | Finding | Requirement | Disposition |
|---|---|---|---|---|
| critical | `.trellis/scripts/generate-skills.mjs` | Stale generated-manifest entries were trusted as prune paths, so `../` could escape `.claude/skills/`. | SC-001, SC-002, SC-005, VAL-008 | fixed; canonical path grammar and pre-mutation tests added |
| critical | `.trellis/scripts/services.mjs` | A modified or symlinked Compose file could inherit Docker authority from a trusted command. | SC-003, SC-005, VAL-008 | fixed; regular-file and complete-payload SHA-256 verification precede Docker |
| blocking | `.specify/specs/001-product-readiness/tasks.md` | T053 and T083 formed an unreachable verification dependency cycle while Analyze said PASS. | FR-017, SUCCESS-005 | fixed in the owning tasks and analysis artifacts; graph is now Review -> gate -> evidence |
| high | `.trellis/scripts/setup-plan.mjs` | One global dependency policy could not represent mixed already-installed and install-approved add-ons. | FR-015, SC-004 | fixed with an exact per-capability policy object and mixed-policy tests |
| high | `.trellis/scripts/run-evals.mjs` | Direct recursion was blocked, but an indirect npm-script path or script cycle could still recurse. | FR-014, INV-002 | fixed with bounded npm-script graph traversal before spawn |
| high | `.trellis/cli.mjs` | Generated setup guides linked to a brownfield guide omitted from the scaffold allowlist. | FR-005, FR-011, FR-015 | fixed; clean-scaffold smoke now proves the complete local-link set |
| high | `docs/repository-mapping.md` | The documented scoped Graphify uninstall command is unsupported in Graphify 0.9.10; the real bare uninstall is broader. | FR-006, FR-007 | fixed from live CLI evidence with explicit project-skill removal guidance |
| high | managed read/write scripts | Symlinked policy, config, skill, docs, metrics, migration, map, and integration inputs could redirect reads or cause partial mutation. | SC-001, SC-002, SC-005, SUCCESS-007 | fixed at each trust boundary with regular-object checks, safety bounds, atomic writes, and negative fixtures |
| advisory | `assets/` | The mark, wordmarks, source transcript, static fallback, GIF, and diagrams add checked-in artifacts. | FR-016 | accepted; each has a distinct brand/source/accessibility role, total assets remain below 400 KiB, and package budgets enforce the ceiling |

## Coverage

- Requirement drift: implementation and public claims match FR-001–FR-017,
  SC-001–SC-005, VAL-001–VAL-008, and the repaired Analyze chain.
- Correctness and failure handling: usage exits remain `2`, operational failures
  remain `1`, required evidence controls exit status, and indirect recursion,
  partial setup, invalid status output, and no-evidence cases fail or skip
  explicitly.
- Security and data integrity: actors are the adopter, an AI agent, repository
  content, optional CLIs, and Docker. Protected assets are user files, outside
  filesystem content, credentials, generated ownership, evidence integrity, and
  Docker authority. All confirmed traversal/redirection paths are closed; no
  auth, money, or application-data implementation is introduced.
- Boundary and dependency direction: core uses Node standard-library APIs only;
  scripts share `config-core.mjs` without circular imports. Graphify, Bounds, and
  Phoenix remain explicit external add-ons. Configured Graphify and Bounds are
  disabled for this repository, so no optional boundary proof is claimed.
- Tests and documentation: behavior changes have focused negative fixtures,
  generated mirrors are byte-identical, docs links pass, the package allowlist
  excludes maintainer history, and a packed installation creates a clean
  passing scaffold.
- Accessibility and operations: visuals include useful alternative text,
  light/dark wordmarks, a reduced-motion fallback, static adjacent prose, small
  file budgets, and valid local rendering. Phoenix binds to localhost, reports
  health, and is not described as application instrumentation.
- Simplicity review: no runtime or development dependency, package edition,
  redundant platform command tree, semantic-map reimplementation, or automatic
  brownfield merger remains. The legacy `test:project` branch is retained only
  as a migration fallback and is bypassed whenever the single preferred
  `check:project` contract exists. Lean already. Ship.

## Decision

PASS. Every blocking review finding is fixed and covered by a focused test. The
remaining advisory asset cost is bounded, purposeful, and materially supports
the requested GitHub launch surface.
