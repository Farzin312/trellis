# Verification: Product Readiness and Truthful Positioning

> Spec: 001
> Status: COMPLETE

## Success criteria

| Criterion | Evidence | Result | Limitation or external owner |
|---|---|---|---|
| SUCCESS-001 | Final source `npm run check`; packed TypeScript scaffold `npm run check`; fresh Node 22 and 24 Linux copies | PASS | Migration, Graphify, Bounds, and application-test evidence correctly report SKIP because this toolkit repository does not configure them |
| SUCCESS-002 | `setup.test.mjs`: every top-level field, nested need/policy, contradictory value, unsafe name/control, oversized file, malformed JSON, and symlink case; stable human/JSON plans | PASS | Planner deliberately performs no execution |
| SUCCESS-003 | `public-docs.test.mjs`, `skills.test.mjs`, installed-package questionnaire, and mixed per-tool policy fixture | PASS | External installation still requires the recorded capability-specific authority and final approval |
| SUCCESS-004 | `evals.test.mjs`: single aggregate dispatch, fallback suppression, direct/indirect wrapper reachability, and script-cycle rejection before spawn | PASS | Static traversal covers referenced npm scripts; arbitrary external executables remain project-owned commands |
| SUCCESS-005 | `sdd-skills.test.mjs`, repaired `analysis.md`, complete phase templates, and byte-identical generated mirrors | PASS | Agent behavior remains subject to the selected platform loading and following the skill |
| SUCCESS-006 | Public asset-budget/alt/fallback tests; every SVG rendered with `rsvg-convert`; GIF inspected with `ffprobe` | PASS | GitHub rendering itself is external, but all formats are supported static SVG/PNG/GIF surfaces with adjacent text |
| SUCCESS-007 | Focused init, skill, docs, map, metrics, migration, integration, mandate, and service negative fixtures; live Compose lifecycle | PASS | Concurrent mutation by another process with the same OS identity is outside repository-level isolation |

## Commands

| Command | Exit | Relevant output | Result |
|---|---:|---|---|
| `node --check` for every CLI/script/test; `bash -n .trellis/init.sh`; `git diff --check` | 0 | no syntax or whitespace errors | PASS |
| `npm run test:self` | 0 | 118 tests, 118 pass, 0 fail/skip/todo | PASS |
| `npm run check` | 0 | required framework self-tests pass; stable result has `required_fail=0`; optional application test is explicitly not configured | PASS |
| `npm ci --ignore-scripts` and `npm audit --omit=dev` | 0 | one package audited; 0 vulnerabilities | PASS |
| `npm pack --dry-run --json` | 0 | `trellis-agent-toolkit@0.1.0`; 112 entries; 448,045-byte archive; executable modes preserved by release test | PASS |
| Pack archive, install under a temporary prefix, run `--version` and setup questions, create a TypeScript scaffold, then run its aggregate | 0 | installed CLI reports 0.1.0; packed scaffold passes; temporary files removed | PASS |
| Full gate from read-only-mounted fresh copies in `node:22-bookworm` and `node:24-bookworm` | 0 / 0 | both report `required_fail=0` and the same explicit optional skips | PASS |
| `trellis services start/status/stop phoenix`; `curl -fsS http://127.0.0.1:6006/healthz`; Compose JSON status | 0 | pinned digest healthy, `OK`, ports bound only to 127.0.0.1, clean stop; test volume and pulled image removed | PASS |
| Render `assets/brand/*.svg` and `assets/readme/*.svg`; inspect raster/GIF metadata | 0 | SVGs render at declared sizes; mark is 1254x1254 RGBA; GIF is 1200x560, 96 frames, 8 seconds | PASS |
| `trellis map --json` | 0 | 126 accepted files, 23 executable test files, 3 documented systems, no truncation or warning, integrations false | PASS |
| `npm view trellis-agent-toolkit name version --json` | 1 | registry returned E404 on 2026-07-11 | WARN |

## Open proof

- No mandatory feature proof is open.
- Graphify and Bounds are intentionally disabled in `.trellis/config.json`, so
  their integration checks are SKIP, not PASS. Their installed CLI help/version
  was inspected for documentation accuracy, but this repository does not invent
  a graph or ownership model merely to make optional badges green.
- The npm E404 confirms only that no public package was visible to this request;
  it does not reserve the package name. Registry publication, Git commit/push,
  remote CI on the resulting commit, GitHub social-preview configuration, and
  real adopter outcomes are release operations outside this local change and
  must not be described as already completed.

## Sign-off

COMPLETE for spec 001. All mandatory criteria have repeatable evidence, Review
has no blocking finding, source and packed-adopter paths pass, and every
unconfigured or external release condition is labeled without converting it to
passed evidence.
