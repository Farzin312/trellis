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
| `trellis graph` | optional project-relative path | none | Runs `graphify update` only when Graphify is configured and installed | FR-006, SC-001 |
| `trellis config` | `show`, `enable`, or `disable` | integration operand for mutations | Validates and atomically manages supported optional integrations | FR-013, VAL-006 |
| `trellis metrics` | none | `--recent`, `--raw` | Rejects corrupt records and summarizes accepted records | FR-008, EDGE-006 |
| `trellis evolve` | none | `--stack=<value>` | Re-runs deterministic project adaptation only | FR-005, VAL-001 |
| `trellis services` | `start`, `stop`, `status`, or `ports` | optional `phoenix` | Returns non-zero when an explicitly requested operation fails | FR-006, SC-003 |
| `trellis version` | none | `--version` alias | Prints the package version | VAL-003 |

Unknown commands, flags, values, or missing operands exit `2`. Operational failures exit `1`. Successful requested work exits `0`.

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
| Claude mandate | `CLAUDE.md` importing `AGENTS.md` | generated one-line bridge | FR-004, INV-001 |

## Gate Output

The eval summary ends with one machine-readable line:

`RESULT required_pass=<n> required_fail=<n> optional_pass=<n> optional_skip=<n> optional_warn=<n>`

No aggregate message may use “all passed” when `optional_skip` or `optional_warn` is non-zero.

## Supported Stack Vocabulary

`generic`, `javascript`, `typescript`, `python`, `go`, and `rust`. Mixed values are accepted explicitly; auto-detection reports every detected stack.
