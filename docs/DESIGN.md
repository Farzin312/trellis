# Trellis Design

> Parent: [documentation index](./README.md)

Trellis is a source-distributed control plane for project guidance and checks.
Its design favors explicit configuration, deterministic evidence, and safe file
ownership over automatic repository rewriting.

## Product boundary

Trellis owns its CLI, initializer, Agent Skills, generated Claude compatibility
files, documentation checks, and optional-integration readiness checks. It does
not own an adopting application's architecture, dependencies, authentication,
authorization, payment state, database policy, or deployment.

Trellis does not configure application authentication. Generated guidance tells
projects to validate trust-boundary input and fail closed, but provider choice
and implementation stay project-owned.

## Design decisions

### One canonical instruction source

Reusable workflows are hand-edited under `.agents/skills/<name>/SKILL.md`.
Claude Code receives a generated `.claude/skills/` mirror. Other platform copies
are not generated. `AGENTS.md` is the durable mandate; `CLAUDE.md` is a minimal
compatibility import.

### A zero-dependency core

The CLI and repository self-tests use Node.js standard-library APIs. Optional
tools are not hidden dependencies of help, initialization, core checks, or docs
verification.

### Explicit optional integrations

Graphify and Bounds are enabled by explicit initialization flags. Phoenix is
started only by an explicit service command. An unconfigured integration is
reported as `SKIP`; a configured integration that is absent or invalid is a
failure with a next action.

### Evidence has a type

Checks report required passes and failures separately from optional passes,
skips, and warnings. A skip never becomes passed evidence. Public claims are
limited to behavior covered by executable metadata or repository tests.

### Safe ownership

`trellis new` copies an allowlisted scaffold payload into a new directory.
Initialization and generation replace only Trellis-owned generated files and
reject malformed input. Merging Trellis into an unrelated repository requires
human review because package files, mandates, hooks, and CI may already be owned
by that project.

## Supported extension points

- Add or update a workflow in `.agents/skills/`, then regenerate the Claude mirror.
- Add stack detection only with fixture coverage and a documented support label.
- Add an optional integration only with explicit configuration, readiness checks,
  failure behavior, and license documentation.
- Add CLI behavior only with argument-validation and exit-status tests.

The implemented component map is in [SYSTEM.md](./SYSTEM.md).
