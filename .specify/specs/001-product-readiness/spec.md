# Spec: Product Readiness and Truthful Positioning

> Spec ID: 001
> Status: in-progress
> Branch: 001-product-readiness

## Problem

Trellis presents itself as a portable, production-grade toolkit for AI-agent workflows, but the repository lacks sufficient executable evidence that its installation paths, quality gates, optional integrations, generated platform artifacts, and public claims remain correct across supported environments and failure modes. This makes successful commands vulnerable to false-positive interpretation, raises adoption risk, and prevents credible differentiation.

## Requirements

### Functional Requirements

- **FR-001**: A maintainer can prove that a clean checkout exposes every documented core CLI workflow without relying on globally installed optional tools.
- **FR-002**: Every quality-gate summary distinguishes executed passes, permitted skips, warnings, and blocking failures without describing skipped evidence as passed evidence.
- **FR-003**: The repository has deterministic, runnable tests for its own load-bearing CLI, initialization, generation, drift-check, and evaluation behavior.
- **FR-004**: Canonical Agent Skills use the shared repository path supported by Codex, OpenCode, and Copilot, with only the required Claude compatibility mirror generated deterministically.
- **FR-005**: Initialization and project creation preserve user work, handle repeated execution safely, and behave correctly for supported stacks and filesystem locations.
- **FR-006**: Optional integrations report absence, staleness, zero coverage, and partial setup with an actionable next step and without false success.
- **FR-007**: Documentation and marketing claims identify the supported scope, prerequisites, evidence, limitations, and genuine differentiators without absolute or unprovable language.
- **FR-008**: Metrics and evaluation output remain token-efficient, deterministic, and machine-actionable while retaining enough detail to diagnose failures.
- **FR-009**: Maintainers can run one documented local command that exercises all mandatory repository gates and returns non-zero when mandatory evidence is absent or broken.
- **FR-010**: Generated files, templates, documentation references, and package metadata contain no placeholder product identity or contradictory support claims in a release-ready checkout.
- **FR-011**: A first-time adopter sees a concise public journey from value proposition through prerequisites, installation, first successful workflow, troubleshooting, licensing, and contribution paths without internal process noise or duplicated prose.
- **FR-012**: An agent or maintainer can obtain a bounded, read-only structural repository map without an LLM, cache, or optional integration; deeper graph and boundary capabilities remain explicit opt-ins.
- **FR-013**: A maintainer can inspect, enable, and disable supported optional integrations through a validated atomic CLI contract, and repeated initialization applies only explicitly requested configuration changes.

### Security Requirements

- **SC-001**: User-controlled names, paths, stack values, environment values, and CLI arguments cannot cause command injection or writes outside the intended target.
- **SC-002**: Initialization and generation never overwrite non-generated user files silently and never expose or persist secret values.
- **SC-003**: Optional networked services remain opt-in, pinned or constrained to supported versions, and isolated from mandatory offline workflows.

### Auth Requirements

- **AUTH-001**: The toolkit must not claim to configure application authentication automatically; generated guidance must preserve fail-closed authentication requirements for adopting projects.

### Validation Requirements

- **VAL-001**: CLI commands reject unsupported or malformed command names, tiers, stacks, agent identifiers, and missing required operands with non-zero status and actionable usage.
- **VAL-002**: Repository checks validate effective coverage, not merely tool exit status, for tests, boundaries, generated artifacts, and documentation.
- **VAL-003**: Release metadata uses one canonical product name, package identity, executable mapping, supported runtime range, and version source.
- **VAL-004**: Public documentation clearly separates adopter guidance, maintainer guidance, generated project content, and historical evidence while keeping each reachable through deliberate navigation.
- **VAL-005**: Repository mapping excludes ignored build, VCS, dependency, secret, and Trellis-history paths; produces stable ordering; and reports counts and documented systems without claiming semantic dependency analysis.
- **VAL-006**: Configuration rejects unsupported schema versions, stacks, agents, integrations, duplicates, and malformed JSON before mutation while preserving unknown project-owned fields.

### Invariants

- **INV-001**: The canonical source files remain the only hand-edited copies of generated agent-platform artifacts.
- **INV-002**: A skipped check never increases the pass count or produces an all-green aggregate claim unless policy explicitly marks that check optional and the output says so.
- **INV-003**: Core initialization, help, checks, and documentation verification work without LLM credentials or paid services.
- **INV-004**: A failed or interrupted generator leaves either the previous valid state or a clearly detectable incomplete state.
- **INV-005**: Existing user changes remain untouched unless the invoked command explicitly owns the generated file and communicates the replacement.

### Edge Cases

- **EDGE-001**: Empty repositories, populated repositories, non-Git directories, worktrees, dirty trees, and directories whose paths contain spaces or shell metacharacters.
- **EDGE-002**: Missing, stale, or incompatible Node.js, npm, Graphify, Bounds, Docker, and agent-platform installations.
- **EDGE-003**: No project tests, no golden tests, no mutation configuration, no graph, zero Bounds-owned files, and all checks skipped.
- **EDGE-004**: Interrupted initialization, repeated initialization, partial generated mirrors, read-only targets, and target-name collisions.
- **EDGE-005**: Unknown stack, mixed-language repository, monorepo, package metadata without a lockfile, and supported runtime/dependency engine mismatch.
- **EDGE-006**: Corrupt metrics records, missing pricing data, unknown models, concurrent metric writes, and very large run histories.
- **EDGE-007**: Missing native platform directories, legacy prompt directories, and attempts to configure platform copies that the canonical shared skill path makes unnecessary.
- **EDGE-008**: Markdown references containing anchors, external URLs, generated paths, code spans, and archived documents.
- **EDGE-009**: Large trees, symlinks, unreadable entries, nested manifests, paths with spaces, and repositories with no documented systems.

## Clarification Log

- The owner explicitly delegated implementation decisions and requested no clarification pause. Ambiguities will be resolved conservatively against current code, executable evidence, and the smallest change that satisfies these requirements.
- The public adopter experience takes precedence over exposing internal development machinery; useful maintainer material remains available behind clearly labeled routes.
- “Perfect” means all mandatory gates and stated acceptance criteria pass in the environments available to this repository; it does not mean defect-free under every unknowable future environment.
- “Any and all projects” means stack-agnostic core behavior plus explicitly documented adapters and limitations, not unsupported universal compatibility.
- “No other product is truly like this” is replaced by evidence-backed differentiation; competitor superiority is out of scope unless independently demonstrated.
- `.codex/` is not a repository skill source. Codex consumes `AGENTS.md` and `.agents/skills/`; Claude alone needs the generated `.claude/skills/` compatibility mirror.
- Cheap orientation is an on-demand structural map. Graphify remains the optional deeper symbol/dependency graph and Bounds remains optional boundary enforcement after real ownership is configured.

## Out of Scope

- Building application-specific auth, payment, database, UI, or deployment code for adopting projects.
- Paid-service provisioning, credential creation, or production deployment.
- Guaranteed compatibility with every editor, model provider, operating system, language, framework, or future tool version.
- Absolute claims of perfection, universal coverage, or market uniqueness.
- New abstractions or integrations that are not required to close an observed, reproducible gap.
