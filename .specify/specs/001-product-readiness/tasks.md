# Tasks: Product Readiness and Truthful Positioning

> Spec: 001

| ID | Task | Type | Files | Refs | Deps | Parallel? |
|---|---|---|---|---|---|---|
| T001 | [TEST] Prove CLI rejects injection, traversal, unknown flags, and missing operands and uses the caller's cwd | test | `.trellis/tests/cli.test.mjs` | SC-001, VAL-001, EDGE-001 | — | — |
| T002 | Replace shell execution with argument arrays, strict parsing, separate toolkit/project roots, and version output | impl | `.trellis/cli.mjs` | FR-001, FR-005, SC-001, VAL-001, VAL-003 | T001 | — |
| T003 | [TEST] Prove scaffolding is atomic, allowlisted, secret-free, and excludes active Trellis specs/history | test | `.trellis/tests/scaffold.test.mjs` | FR-005, SC-002, INV-004, INV-005, EDGE-004 | T002 | — |
| T004 | Implement explicit scaffold payload and sibling-temp atomic rename | impl | `.trellis/cli.mjs` | FR-005, SC-002, INV-004, INV-005 | T003 | — |
| T005 | [TEST] Prove identity/stack/config adaptation is strict, structural, mixed-stack aware, and idempotent | test | `.trellis/tests/adapt.test.mjs` | FR-005, FR-010, VAL-001, VAL-003, EDGE-005, EDGE-007 | — | [P] |
| T006 | Make project adaptation own validated identity, stack detection, and configuration serialization | impl | `.trellis/scripts/adapt-to-project.mjs` | FR-005, FR-010, VAL-001, VAL-003 | T005 | [P] |
| T007 | [TEST] Prove initialization fails fast and preserves existing configs and Git hooks | test | `.trellis/tests/init.test.mjs` | FR-005, SC-002, INV-005, EDGE-002, EDGE-004 | T006 | — |
| T008 | Simplify initialization around preflight, adaptation, safe template creation, generation, and explicit integrations | impl | `.trellis/init.sh` | FR-001, FR-005, FR-006, SC-002, SC-003, INV-003, INV-005 | T007 | — |
| T009 | [TEST] Prove the interactive wizard maps stack and integration choices to validated init options and propagates child failure | test | `.trellis/tests/wizard.test.mjs` | FR-005, VAL-001, EDGE-005 | T006 | [P] |
| T010 | Remove fake tiers and no-op platform selection; make the wizard select stacks and optional integrations directly | impl | `.trellis/scripts/wizard.mjs` | FR-005, FR-006, VAL-001 | T009 | [P] |
| T011 | [TEST] Prove canonical skills validate and generated Claude mirrors match without deleting user-owned files | test | `.trellis/tests/skills.test.mjs` | FR-004, SC-002, INV-001, EDGE-007 | — | [P] |
| T012 | Move specialist sources to the shared Agent Skills path | impl | `.agents/skills/**` | FR-004, INV-001 | T011 | [P] |
| T013 | [TEST] Prove every SDD phase is a valid, directly invocable Agent Skill in canonical order | test | `.trellis/tests/sdd-skills.test.mjs` | FR-003, FR-004, FR-010 | — | [P] |
| T014 | Convert the nine phase prompts into canonical Agent Skills and remove legacy prompt sources | impl | `.agents/skills/speckit-*/SKILL.md` | FR-004, INV-001 | T013 | [P] |
| T015 | [TEST] Prove mirror generation is atomic, deterministic, and scoped to Trellis-owned paths | test | `.trellis/tests/skills.test.mjs` | FR-004, SC-002, INV-001, INV-004 | T012, T014 | — |
| T016 | Generate only the Claude compatibility mirror from canonical Agent Skills | impl | `.trellis/scripts/generate-skills.mjs` | FR-004, INV-001, INV-004 | T015 | — |
| T017 | [TEST] Prove missing, malformed, oversized, or drifted canonical skills block the health gate | test | `.trellis/tests/skills.test.mjs` | FR-003, FR-004, VAL-002 | T016 | — |
| T018 | Consolidate skill validation and delete obsolete command/skill sync scripts | impl | `.trellis/scripts/evolve-skills.mjs` | FR-003, FR-004, VAL-002 | T017 | — |
| T019 | [TEST] Prove Claude imports AGENTS without duplicating it and drift blocks | test | `.trellis/tests/mandate.test.mjs` | FR-003, FR-004, INV-001 | — | [P] |
| T020 | Replace the copied mandate with a minimal import bridge and matching validator | impl | `CLAUDE.md`, `.trellis/scripts/check-mandate-sync.mjs` | FR-004, INV-001 | T019 | [P] |
| T021 | [TEST] Prove eval output distinguishes required pass/fail and optional skip/warn across mixed manifests | test | `.trellis/tests/evals.test.mjs` | FR-002, FR-003, FR-008, VAL-002, INV-002, EDGE-003, EDGE-005 | — | [P] |
| T022 | Make framework self-tests mandatory and aggregate every detected configured project test command honestly | impl | `.trellis/scripts/run-evals.mjs` | FR-002, FR-003, FR-008, VAL-002, INV-002 | T021 | [P] |
| T023 | [TEST] Prove corrupt metrics and invalid numeric records fail with line evidence | test | `.trellis/tests/metrics.test.mjs` | FR-008, VAL-002, EDGE-006 | — | [P] |
| T024 | Validate the optional JSONL ledger and summarize only accepted provider-supplied usage/cost fields | impl | `.trellis/scripts/metrics.mjs` | FR-008, VAL-002, EDGE-006 | T023 | [P] |
| T025 | [TEST] Prove configured optional integrations fail when absent/corrupt and unconfigured integrations skip explicitly | test | `.trellis/tests/integrations.test.mjs` | FR-006, SC-003, VAL-002, EDGE-002, EDGE-003 | T006 | [P] |
| T026 | Consolidate Graphify and Bounds readiness into one configuration-aware check | impl | `.trellis/scripts/check-integrations.mjs` | FR-006, SC-003, VAL-002 | T025 | [P] |
| T027 | [TEST] Prove explicit service actions reject unknown values and return non-zero on requested failures | test | `.trellis/tests/services.test.mjs` | FR-006, SC-003, VAL-001 | — | [P] |
| T028 | Use argument-array Docker execution and strict service action status | impl | `.trellis/scripts/services.mjs` | FR-006, SC-003, VAL-001 | T027 | [P] |
| T029 | [TEST] Prove migration adapters require unambiguous evidence and filename patterns match exactly | test | `.trellis/tests/migrations.test.mjs` | FR-003, FR-006, VAL-002, EDGE-005 | — | [P] |
| T030 | Remove ambiguous migration detection and overclaimed pass summaries | impl | `.trellis/scripts/check-migration-safety.mjs` | FR-006, VAL-002 | T029 | [P] |
| T031 | [TEST] Prove doc checks fail broken links/breadcrumbs in both modes and never claim semantic truth | test | `.trellis/tests/docs.test.mjs` | FR-003, FR-007, VAL-002, VAL-004, EDGE-008 | — | [P] |
| T032 | Make documentation automation a deterministic read-only structure/link check | impl | `.trellis/scripts/check-docs.mjs` | FR-007, VAL-002, VAL-004 | T031 | [P] |
| T033 | [TEST] Lock the zero-dependency package identity, engine, bin, scripts, files, repository, and license metadata | test | `.trellis/tests/package.test.mjs` | FR-001, FR-009, FR-010, VAL-003 | — | [P] |
| T034 | Align package metadata and make one `npm run check` the gate source of truth | impl | `package.json` | FR-001, FR-009, FR-010, VAL-003 | T033 | — |
| T035 | [TEST] Prove CI invokes only the aggregate gate with no ignored failures or nonexistent paths | test | `.trellis/tests/ci.test.mjs` | FR-002, FR-009, INV-002 | — | [P] |
| T036 | Replace split workflows with one blocking CI workflow | impl | `.github/workflows/ci.yml` | FR-002, FR-009, INV-002 | T035 | — |
| T037 | [TEST] Lock public install, support, licensing, compatibility, and positioning claims to executable metadata | test | `.trellis/tests/public-docs.test.mjs` | FR-007, FR-010, FR-011, AUTH-001, VAL-003, VAL-004 | T034 | — |
| T038 | Rewrite the adopter README as one evidence-backed journey with dated market context | docs | `README.md` | FR-007, FR-011, AUTH-001, VAL-004 | T037 | — |
| T039 | [TEST] Prove docs route adopters, maintainers, generated projects, and history without placeholders | test | `.trellis/tests/public-docs.test.mjs` | FR-010, FR-011, VAL-004 | T038 | — |
| T040 | Rebuild the documentation index and architecture/design docs around implemented surfaces only | docs | `docs/README.md`, `docs/DESIGN.md`, `docs/SYSTEM.md` | FR-007, FR-010, FR-011, VAL-004 | T039 | — |
| T041 | [TEST] Prove eval, language, metrics, service, and skill docs label tested/configured/manual capabilities accurately | test | `.trellis/tests/public-docs.test.mjs` | FR-002, FR-006, FR-007, FR-008, VAL-004 | T040 | — |
| T042 | Rewrite capability docs and remove non-integrated service and automatic-observability claims | docs | `docs/evals.md`, `docs/language-support.md`, `docs/metrics.md`, `docs/self-hosted-services.md`, `docs/skills.md`, `docs/evolution.md`, `docs/credits.md` | FR-002, FR-006, FR-007, FR-008, VAL-004 | T041 | — |
| T043 | [TEST] Prove mandates, constitution, coding standards, and SDD docs share one nine-phase stack-agnostic contract | test | `.trellis/tests/public-docs.test.mjs` | FR-004, FR-010, AUTH-001, INV-001 | T042 | — |
| T044 | Align durable agent guidance and generic engineering policy with current commands and skill paths | docs | `AGENTS.md`, `docs/README-FOR-AGENTS.md`, `docs/STRUCTURE.md`, `docs/sdd/sdd.md`, `docs/coding-standards.md`, `.specify/memory/constitution.md` | FR-004, FR-010, AUTH-001, INV-001 | T043 | — |
| T045 | [TEST] Prove generated projects have a project README, minimal optional env template, and no Trellis release history | test | `.trellis/tests/scaffold.test.mjs` | FR-010, FR-011, VAL-004 | T044 | — |
| T046 | Generate a project-scoped README, retain a scoped Trellis license, and reduce env guidance to real optional values | impl | `.trellis/init.sh`, `.trellis/LICENSE`, `.env.example` | FR-010, FR-011, VAL-004 | T045 | — |
| T047 | [TEST] Run clean `npm ci`, package dry-run, scaffold smoke, and aggregate gate from a fresh checkout copy | test | `.trellis/tests/release.test.mjs` | FR-001, FR-003, FR-009, FR-010 | T034, T036, T046 | — |
| T048 | Generate and commit the deterministic lockfile | impl | `package-lock.json` | FR-001, FR-009, VAL-003 | T047 | — |
| T049 | [TEST] Verify removed legacy mirrors, fake tiers, golden freezing, unused pricing, and obsolete workflows are absent | test | `.trellis/tests/release.test.mjs` | FR-004, FR-007, FR-010, INV-001 | T048 | — |
| T050 | Prune only obsolete Trellis-owned generated and unsupported files | cleanup | legacy generated paths and retired scripts | FR-004, FR-007, FR-010, INV-001 | T049 | — |
| T051 | Document the root-cause fixes and migration impact in the append-only bug register | docs | `docs/bug-fixes/2026-07-11-product-readiness.md` | FR-007, FR-010 | T050 | — |
| T052 | Generate the Claude mirror and update all artifact references | generated | `.claude/skills/**` and documentation references | FR-004, INV-001 | T018, T020, T044, T050 | — |
| T054 | [TEST] Prove repository mapping is read-only, bounded, stable, excludes sensitive/generated trees, and reports documented systems | test | `.trellis/tests/repo-map.test.mjs` | FR-012, SC-001, VAL-005, EDGE-001, EDGE-009 | — | [P] |
| T055 | Implement the dependency-free structural map and expose it through strict CLI parsing | impl | `.trellis/scripts/repo-map.mjs`, `.trellis/cli.mjs` | FR-012, SC-001, VAL-005 | T054 | — |
| T056 | Document the core map versus optional Graphify and Bounds responsibilities without compatibility overclaims | docs | `README.md`, `docs/SYSTEM.md`, `docs/language-support.md` | FR-006, FR-007, FR-012, VAL-005 | T055 | — |
| T057 | Lock Codex, shared Agent Skills, and Claude mirror paths while proving legacy command and `.codex/` surfaces stay absent | test | `.trellis/tests/skills.test.mjs`, `.trellis/tests/public-docs.test.mjs` | FR-004, FR-010, INV-001 | T052 | — |
| T058 | [TEST] Prove config show/enable/disable is strict, atomic, idempotent, and preserves unrelated fields | test | `.trellis/tests/config.test.mjs` | FR-006, FR-013, SC-002, VAL-006, INV-004, INV-005 | — | [P] |
| T059 | Implement the shared configuration validator and CLI management surface | impl | `.trellis/scripts/config.mjs`, `.trellis/cli.mjs` | FR-006, FR-013, SC-002, VAL-006 | T058 | — |
| T060 | Make repeated initialization update only explicitly requested managed configuration | impl | `.trellis/init.sh`, `.trellis/tests/init.test.mjs` | FR-005, FR-013, INV-005 | T059 | — |
| T061 | Document Graphify and Bounds enablement, prerequisites, readiness, operation, and removal with current command evidence | docs | `README.md`, `docs/SYSTEM.md`, `docs/language-support.md`, `docs/README.md` | FR-006, FR-007, FR-013, VAL-004 | T059, T060 | — |
| T062 | [TEST] Prove `check:project` runs once, suppresses fallback adapters, and rejects recursive wrappers | test | `.trellis/tests/evals.test.mjs` | FR-014, SUCCESS-004 | — | [P] |
| T063 | Implement and document the preferred project-owned aggregate gate while retaining `test:project` compatibility | impl | `.trellis/scripts/run-evals.mjs`, `README.md`, `docs/evals.md`, `docs/language-support.md`, `docs/adopting-existing-projects.md` | FR-014 | T062 | — |
| T064 | [TEST] Prove the human wizard's displayed yes/no defaults match actual behavior and existing configuration is described truthfully | test | `.trellis/tests/wizard.test.mjs` | FR-005, SC-004, EDGE-010 | — | [P] |
| T065 | Fix human wizard defaults and preserve existing setup choices without pretending to auto-detect or disable them | impl | `.trellis/scripts/wizard.mjs` | FR-005, SC-004 | T064 | — |
| T066 | [TEST] Prove adaptation, config, and skill generation refuse symlinked mutation roots without changing targets | test | `.trellis/tests/adapt.test.mjs`, `.trellis/tests/config.test.mjs`, `.trellis/tests/skills.test.mjs` | SC-001, SC-002, SC-004, EDGE-009 | — | [P] |
| T067 | Harden policy, config, and generated-skill writes with symlink rejection and atomic publication | impl | `.trellis/scripts/adapt-to-project.mjs`, `.trellis/scripts/config-core.mjs`, `.trellis/scripts/generate-skills.mjs` | SC-001, SC-002, SC-004 | T066 | — |
| T068 | [TEST] Prove canonical health rejects mirror-only drift but accepts specification-valid large external skills with an efficiency warning | test | `.trellis/tests/skills.test.mjs`, `.trellis/tests/public-docs.test.mjs` | FR-004, FR-008, INV-001 | — | [P] |
| T069 | Validate manifest inventory and symlinks, retain a safety bound, and keep strict compact budgets on Trellis-owned skills only | impl | `.trellis/scripts/evolve-skills.mjs`, `docs/skills.md` | FR-004, FR-008, INV-001 | T068 | — |
| T070 | [TEST] Prove the cheap repository map excludes generated Claude mirrors and Bounds cache data | test | `.trellis/tests/repo-map.test.mjs` | FR-012, VAL-005 | — | [P] |
| T071 | Exclude duplicate/generated mapping noise and document the exact map boundary | impl | `.trellis/scripts/repo-map.mjs`, `docs/repository-mapping.md` | FR-012, VAL-005 | T070 | — |
| T072 | [TEST] Prove guided questions and plans require every field, reject unsafe/unresolved answers, remain stable, and never write the target | test | `.trellis/tests/setup.test.mjs`, `.trellis/tests/cli.test.mjs` | FR-015, SC-004, VAL-007, SUCCESS-002 | — | [P] |
| T073 | Implement the dependency-free setup question schema, plan renderer, and strict CLI surface | impl | `.trellis/scripts/setup-plan.mjs`, `.trellis/cli.mjs` | FR-015, SC-004, VAL-007 | T072 | — |
| T074 | [TEST] Prove the bundled setup skill gates execution on the canonical questions, consent, reviewed merge, and verification | test | `.trellis/tests/sdd-skills.test.mjs`, `.trellis/tests/public-docs.test.mjs` | FR-015, SUCCESS-003 | T073 | — |
| T075 | Add the portable `trellis-setup` Agent Skill and generate its Claude mirror | impl | `.agents/skills/trellis-setup/SKILL.md`, `.claude/skills/trellis-setup/SKILL.md` | FR-004, FR-015, SC-004 | T074 | — |
| T076 | Publish aligned AI-assisted and manual setup guides with exact pinned optional-tool actions, pros, drawbacks, and completion checks | docs | `docs/AI-SETUP.md`, `docs/manual-setup.md`, `README.md`, `docs/README.md` | FR-007, FR-011, FR-015, SUCCESS-003 | T073, T075 | — |
| T077 | [TEST] Prove Clarify requires labeled A/B/C/D choices and Analyze repairs fixable artifact gaps before re-running its hard gate | test | `.trellis/tests/sdd-skills.test.mjs`, `.trellis/tests/public-docs.test.mjs` | FR-017, SUCCESS-005 | — | [P] |
| T078 | Harden Clarify and Analyze and add complete clarify/analysis/review/verify templates with traceability | impl | `.agents/skills/speckit-clarify/SKILL.md`, `.agents/skills/speckit-analyze/SKILL.md`, `.specify/templates/**`, `docs/sdd/sdd.md` | FR-017, SUCCESS-005 | T077 | — |
| T079 | [TEST] Prove README brand assets exist, are bounded, have meaningful alt text, and do not carry essential unsupported animation | test | `.trellis/tests/public-docs.test.mjs`, `.trellis/tests/release.test.mjs` | FR-016, EDGE-011, SUCCESS-006 | — | [P] |
| T080 | Add the Trellis mark, static workflow/product diagrams, and an evidence-first GitHub README hierarchy | docs | `assets/brand/**`, `assets/readme/**`, `README.md` | FR-007, FR-011, FR-016, SUCCESS-006 | T079 | — |
| T081 | Regenerate all managed skill mirrors and synchronize package/scaffold/document references | generated | `.claude/skills/**`, `.trellis/generated-skills.json`, `package.json`, `.trellis/cli.mjs`, documentation | FR-004, FR-010, FR-015, FR-017 | T069, T075, T078, T080 | — |
| T084 | [TEST] Prove guided setup exposes a complete answer shape and applies dependency authority independently to every selected add-on | test | `.trellis/tests/setup.test.mjs`, `.trellis/tests/public-docs.test.mjs` | FR-015, SC-004, SUCCESS-002, SUCCESS-003 | T072 | — |
| T085 | Implement per-capability dependency policy, safe installer prerequisites, and a non-default answer example shared by CLI and manuals | impl | `.trellis/scripts/setup-plan.mjs`, `.agents/skills/trellis-setup/SKILL.md`, `docs/AI-SETUP.md`, `docs/manual-setup.md` | FR-015, SC-004, VAL-007 | T084 | — |
| T086 | [TEST] Prove init, generated manifests/trees, maps, metrics, migrations, integrations, and services reject traversal, symlink, oversized, or modified privileged inputs before side effects | test | `.trellis/tests/{init,skills,repo-map,metrics,migrations,integrations,services,mandate}.test.mjs` | SC-001, SC-002, SC-003, SC-005, VAL-008, SUCCESS-007 | — | [P] |
| T087 | Harden every tested repository trust boundary with regular-file checks, canonical path grammar, bounded reads, atomic manifests, and Compose payload verification | impl | `.trellis/init.sh`, `.trellis/scripts/{generate-skills,repo-map,metrics,check-migration-safety,check-integrations,check-mandate-sync,services}.mjs` | SC-001, SC-002, SC-003, SC-005, VAL-008 | T086 | — |
| T088 | Promote GitHub-recognized contribution guidance and synchronize security, system, mapping, service, licensing, changelog, and bug-fix documentation | docs | `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `docs/**`, `package.json` | FR-007, FR-010, FR-011, SC-005, VAL-004 | T085, T087 | — |
| T082 | Review every changed file for correctness, security, boundary drift, docs truth, accessibility, and excess complexity; fix all blockers | review | repository and `.specify/specs/001-product-readiness/review.md` | FR-001–FR-017, SC-001–SC-005 | T081, T085, T087, T088 | — |
| T053 | Run formatter-free syntax checks, self-tests, `npm ci`, `npm run check`, package dry-run, scaffold smoke, and configured-integration readiness | verify | repository | FR-001–FR-017, SC-001–SC-005, VAL-001–VAL-008, INV-001–INV-005 | T082 | — |
| T083 | Record empirical feature, package, clean-scaffold, Node 22/24, visual-asset, and optional-integration evidence | verify | repository and `.specify/specs/001-product-readiness/verify.md` | SUCCESS-001–SUCCESS-007 | T053 | — |

Markers:
- `[TEST]` — run to observed failure before its paired implementation.
- `[P]` — parallel-safe only after its listed dependencies pass.

## Completion status

T001–T088 are complete. Blocking dispositions are recorded in `review.md`; the
final command, package, runtime, service, visual, and external-limit evidence is
recorded in `verify.md`.
