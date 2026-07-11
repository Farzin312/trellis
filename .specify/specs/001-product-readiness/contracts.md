# Contracts: Product Readiness and Truthful Positioning

> Spec: 001

## CLI

| Command | Required operands | Accepted options | Success contract | Refs |
|---|---|---|---|---|
| `trellis new` | one child-directory basename | `--stack=<value>`, `--with-graphify`, `--with-bounds` | Atomically creates a curated scaffold | FR-001, FR-005, SC-001, INV-004 |
| `trellis init` | optional project name | `--stack=<value>`, `--with-graphify`, `--with-bounds` | Configures a checkout already containing `.trellis/` without overwriting user-owned files | FR-005, SC-002, INV-005 |
| `trellis check` | none | `--ai` | Runs the single mandatory gate contract in the current project | FR-002, FR-008, FR-009 |
| `trellis eval` | none | `--ai` | Runs required framework tests plus configured project evals in the current project | FR-002, FR-003 |
| `trellis map` | none | `--json` | Prints a bounded, read-only structural map without optional tools | FR-012, VAL-005 |
| `trellis graph` | none | none | Runs `graphify update .` only when Graphify is configured and installed | FR-006, SC-001 |
| `trellis config` | `show`, `enable`, or `disable` | integration operand for mutations | Validates and atomically manages supported optional integrations | FR-013, VAL-006 |
| `trellis metrics` | none | `--recent`, `--raw` | Rejects corrupt records and summarizes accepted records | FR-008, EDGE-006 |
| `trellis evolve` | none | `--stack=<value>` | Re-runs deterministic project adaptation only | FR-005, VAL-001 |
| `trellis services` | `start`, `stop`, `status`, or `ports` | optional `phoenix` | Returns non-zero when an explicitly requested operation fails; Docker actions require the exact reviewed regular Compose payload | FR-006, SC-003, SC-005 |
| `trellis version` | none | `--version` alias | Prints the package version | VAL-003 |
| `trellis setup` | `questions` or `plan` | `--json`; `--answers=<path>` for plan | Emits the mandatory questionnaire or validates answers and emits a deterministic read-only adoption plan | FR-015, SC-004, VAL-007 |

Unknown commands, flags, values, or missing operands exit `2`. Operational failures exit `1`. Successful requested work exits `0`.

## Guided Setup Answers

The caller supplies a JSON object no larger than 64 KiB. Unknown fields are rejected.

| Field | Contract |
|---|---|
| `schema_version` | exactly `1` |
| `mode` | `new` or `existing` |
| `target_directory` | safe child basename for `new`; omitted for `existing` |
| `project_name` | trimmed display name, 1–200 characters, without slashes or controls |
| `project_scope` | concrete project purpose, 10–500 characters |
| `stacks` | non-empty unique supported stack array; `generic` cannot be combined |
| `risk_surfaces` | non-empty unique subset of `none`, `auth`, `payments`, `personal-data`, `secrets`, `database`, `deployment`; `none` cannot be combined |
| `project_gate` | `configured` or `not-yet` |
| `needs` | exact booleans for `semantic_graph`, `enforced_boundaries`, and `local_observability` |
| `external_tool_policy` | Exact object keyed by `semantic_graph`, `enforced_boundaries`, and `local_observability`; each value is `already-installed`, `install-approved`, `do-not-install`, or `not-selected`; selected add-ons require the first two and unselected add-ons require `not-selected` |
| `tradeoffs_acknowledged` | must be `true` before a plan is emitted |

Question output gives each field an ID, prompt, why it matters, allowed answers, and trade-offs. Human output is concise prose. JSON output is stable structured data. Plan generation never writes the target.

## Managed Filesystem Inputs

- Generated skill manifest entries match exactly
  `.claude/skills/<valid-skill-name>`; traversal and duplicates fail before
  mirror mutation or pruning.
- Policy, config, skill, setup-answer, metrics, migration, and configured
  integration inputs must be regular project-local non-symlink objects at their
  managed boundary. Bounded parsers reject oversized setup, metrics, migration,
  and graph inputs.
- Docker-backed service actions hash the complete bundled Compose bytes and
  compare them with the reviewed SHA-256 contract before calling Docker.
- Read-only commands may warn and fall back to structural detection when
  optional project metadata is unsafe; they never treat redirected content as
  configured project state.

## Project Configuration

`.trellis/config.json`:

| Field | Type | Contract | Refs |
|---|---|---|---|
| `schema_version` | integer | exactly `1` | VAL-001 |
| `project_name` | string | non-empty display name | VAL-003 |
| `project_slug` | string | npm-safe lowercase slug | VAL-003 |
| `stacks` | string array | unique values from the supported vocabulary | VAL-001, EDGE-005 |
| `enabled_integrations` | string array | unique subset of `graphify`, `bounds` | FR-006, SC-003 |

## Skill Distribution

| Surface | Path | Ownership | Refs |
|---|---|---|---|
| Canonical Agent Skills | `.agents/skills/<name>/SKILL.md` | hand-edited | FR-004, INV-001 |
| Claude compatibility | `.claude/skills/<name>/SKILL.md` | generated | FR-004, INV-001 |
| Claude mandate | `CLAUDE.md` importing `AGENTS.md` first | managed bridge; optional Claude-only addendum is preserved | FR-004, INV-001 |

## Gate Output

The eval summary ends with one machine-readable line:

`RESULT required_pass=<n> required_fail=<n> optional_pass=<n> optional_skip=<n> optional_warn=<n>`

No aggregate message may use “all passed” when `optional_skip` or `optional_warn` is non-zero.

## Supported Stack Vocabulary

`generic`, `javascript`, `typescript`, `python`, `go`, and `rust`. Mixed values are accepted explicitly; auto-detection reports every detected stack.
