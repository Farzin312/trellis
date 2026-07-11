# Evaluation and Gate Contract

> Parent: [documentation index](./README.md)

Trellis distinguishes required evidence from optional evidence. The gate reports
what ran; it does not turn missing coverage into success.

## Status vocabulary

| Status | Meaning |
|---|---|
| `PASS` | The named check executed and met its contract |
| `FAIL` | The named required or configured check executed unsuccessfully or required evidence was absent |
| `WARN` | Optional evidence ran but needs attention; the warning remains visible |
| `SKIP` | An unconfigured optional capability did not run; this is not passed evidence |

Required checks determine the process exit status. Optional checks are counted
separately as optional passes, skips, or warnings. A configured optional
integration can fail and block when its configuration promises that capability.

## Commands

```bash
npm run test:self # toolkit standard-library self-tests only
npm test          # toolkit self-tests plus the configured project gate/adapters
trellis eval      # same evidence runner as npm test
npm run check     # single maintainer/release gate
```

Use `--ai` with the Trellis CLI for concise agent-oriented progress. The eval
summary itself ends with one stable machine-readable line:

```text
RESULT required_pass=<n> required_fail=<n> optional_pass=<n> optional_skip=<n> optional_warn=<n>
```

The command exits non-zero when `required_fail` is nonzero.

## Required evidence

The aggregate gate owns the repository self-tests and the configured structural
checks referenced by `package.json`. It includes public claim tests, package and
CLI contracts, generated-file drift checks, and documentation link/breadcrumb
verification. The exact list in the executable package scripts is authoritative.

The preferred application contract is one project-owned `check:project` package
script. Put every blocking application command there: build, lint, type checks,
tests, migration validation, and any project-specific integration or browser
gate. Trellis executes that script exactly once and does not also run its
language adapters, which avoids duplicate suites in mixed-stack repositories.

`check:project` must not call `npm run check`, `npm test`, `trellis check`,
`trellis eval`, or the Trellis eval script; those paths recurse and fail before
execution. It may call project-owned scripts such as `test:project`.

For compatibility, a repository without `check:project` can expose
`test:project`; Trellis runs it and then evaluates detected Python, Go, and Rust
test evidence. Test files without a configured JavaScript project command are a
warning. A present but broken command is a required failure with its exit
status. Missing evidence remains an explicit skip or warning, never a pass.

## Optional evidence

Graphify, Bounds, Phoenix, and language-specific tools outside the core are not
assumed. Their state is classified as follows:

- not configured: `SKIP` plus the configuration action
- configured and ready: optional `PASS`
- configured but absent, stale, or invalid: `FAIL` plus a repair action
- executed but non-blocking by explicit policy: `WARN`

See [language support](./language-support.md) for tested command dispatch and
[repository mapping](./repository-mapping.md) for optional-integration evidence.
