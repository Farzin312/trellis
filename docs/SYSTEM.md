# Trellis System Reference

> Parent: [documentation index](./README.md)

This document maps implemented surfaces to their owning files. It is a reference
for maintainers, not an installation guide.

## Control flow

```text
source checkout
  -> package.json exposes the trellis executable
  -> .trellis/cli.mjs validates a command and arguments
  -> init/new adapt Trellis-owned project files
  -> .agents/skills remains the canonical workflow source
  -> generate-skills creates only the .claude/skills mirror
  -> npm run check runs the repository's blocking evidence gate
```

Optional Graphify, Bounds, and Phoenix actions are outside the core path and run
only when explicitly requested or configured.

## Implemented commands

| Command | Implemented responsibility |
|---|---|
| `trellis new <name>` | Create a new project from the allowlisted scaffold payload |
| `trellis init [name]` | Configure a checkout that already contains Trellis |
| `trellis check` | Run the same aggregate gate as `npm run check` |
| `trellis eval` | Run required toolkit self-tests and configured project tests |
| `trellis map [--json]` | Print a bounded read-only structural repository map |
| `trellis config show` | Validate and display project configuration without writing |
| `trellis config enable\|disable <graphify\|bounds>` | Atomically manage project-wide optional requirements |
| `trellis graph [path]` | Run `graphify update` only when Graphify is configured and available |
| `trellis metrics [--recent\|--raw]` | Validate and summarize the optional JSONL ledger |
| `trellis evolve [--stack=<value>]` | Re-run deterministic project adaptation |
| `trellis services <start\|stop\|status\|ports> [phoenix]` | Manage the bundled Phoenix compose service |
| `trellis version` / `trellis --version` | Print the version from `package.json` |

`trellis help --ai` is the executable CLI reference. Documentation must not add
commands or options that help does not expose.

## Artifact ownership

| Artifact | Owner | Mutation rule |
|---|---|---|
| `package.json` | Trellis release metadata | Version and executable mapping are canonical |
| `AGENTS.md` | Maintainer-authored mandate | Hand edit |
| `CLAUDE.md` | Compatibility bridge | Generate from the mandate contract |
| `.agents/skills/**` | Canonical Agent Skills | Hand edit |
| `.claude/skills/**` | Claude compatibility | Generate; do not hand edit |
| `.trellis/config.json` | Project-wide stacks and enabled integrations | Validate and write atomically; preserve unrelated fields |
| `.specify/specs/**` | Point-in-time delivery evidence | Append through the SDD workflow |
| `docs/**` | Living and historical documentation | Route by audience; preserve breadcrumbs |
| `.trellis/metrics/runs.jsonl` | Optional local ledger | Validate every nonblank record before summarizing |

## Checks

- Node standard-library self-tests cover CLI, initialization, generation, docs,
  package metadata, optional integrations, services, and gate summaries.
- Documentation checks validate structure, breadcrumbs, and local links; public
  claim tests cover executable names, support labels, paths, and licensing text.
- The aggregate gate exits non-zero when required evidence fails.
- Optional evidence remains visible as optional `PASS`, `SKIP`, or `WARN`.

See [evals.md](./evals.md) for status semantics and
[DESIGN.md](./DESIGN.md) for product boundaries. See
[repository mapping](./repository-mapping.md) for Graphify and Bounds setup and
readiness semantics.
