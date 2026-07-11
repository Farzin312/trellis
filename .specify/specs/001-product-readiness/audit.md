# Audit: Product Readiness and Truthful Positioning

> Spec: 001
> Baseline: 2026-07-10

## Blocking Findings

| ID | Finding | Evidence | Refs |
|---|---|---|---|
| A-001 | CLI arguments reach shell command strings and allow command injection. | `.trellis/cli.mjs` command runner and passthrough commands | SC-001, VAL-001 |
| A-002 | Project commands execute in the toolkit installation instead of the caller's repository. | `.trellis/cli.mjs` fixes `cwd` to the template root | FR-001, FR-005 |
| A-003 | New projects copy the live worktree through a denylist, including ignored secrets and internal specs. | `.trellis/cli.mjs` recursive copy filter | SC-002, INV-004, INV-005 |
| A-004 | CI cannot install or locate its scripts, and ignored failures are presented as healthy. | no lockfile; `.github/workflows/*.yml` use `scripts/`; `continue-on-error` and `|| true` | FR-002, FR-003, FR-009 |
| A-005 | The eval runner prints an all-passed claim when tests, mutation, and golden evidence are absent. | `.trellis/scripts/run-evals.mjs` baseline output | FR-002, VAL-002, INV-002 |
| A-006 | Current generated paths do not match current Codex and OpenCode project discovery paths. | `.codex/prompts`, `.codex/agents`, and singular `.opencode/command` outputs | FR-004, FR-006 |
| A-007 | Initialization overwrites test configs and Git hooks, silently accepts malformed input, and prints success after swallowed failures. | `.trellis/init.sh`, `wizard.mjs`, `adapt-to-project.mjs` | FR-005, SC-002, VAL-001 |
| A-008 | Product identity, runtime support, install instructions, commands, and release metadata contradict one another. | `README.md`, `AGENTS.md`, `docs/README.md`, `package.json` | FR-007, FR-010, FR-011, VAL-003 |
| A-009 | Public licensing language contradicts the bundled MIT notice and calls an ELv2 integration open source. | `README.md`, `LICENSE`, `docs/credits.md`, `docs/self-hosted-services.md` | FR-007, VAL-004 |
| A-010 | Fake tiers, golden freezing, automatic evolution, universal language support, and automatic token accounting are described as implemented guarantees although the code does not provide them. | public docs compared with `.trellis/scripts/**` | FR-007, FR-010, INV-002 |

## High-Impact Simplifications

| ID | Cut | Replacement | Refs |
|---|---|---|---|
| P-001 | Four copies of every skill and command | Canonical `.agents/skills/` plus a Claude mirror | FR-004, INV-001 |
| P-002 | Three unenforced product tiers | Core plus explicit optional integrations | FR-006, FR-011 |
| P-003 | Golden test copying and marker-only freezes | Project-owned regression tests plus spec verification evidence | FR-002, FR-003 |
| P-004 | Unused Vitest, Stryker, fast-check, and Zod dependencies in the toolkit | Node standard-library self-tests; optional project adapters remain documented | FR-001, FR-003 |
| P-005 | Three divergent CI workflows | One blocking `npm run check` workflow | FR-009, INV-002 |
| P-006 | Promotional and internal-process README sections | Linear adopter journey plus audience-routed deep docs | FR-007, FR-011, VAL-004 |

## External Compatibility Evidence

- Codex documents repository skills under `.agents/skills/` and deprecates custom prompts.
- OpenCode documents repository skills under `.agents/skills/` or `.opencode/skills/` and commands under `.opencode/commands/`.
- GitHub Copilot documents repository skills under `.agents/skills/`, `.github/skills/`, or `.claude/skills/`.
- Claude Code documents `.claude/skills/` and recommends importing `AGENTS.md` from `CLAUDE.md` to avoid duplication.
- Spec Kit and OpenSpec already cover broad multi-agent SDD; Trellis must position around its repository-local governance bundle rather than claim category uniqueness.

## Baseline Result

`Result: FAIL` until A-001 through A-010 are either corrected or removed from the supported surface.
