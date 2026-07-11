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
npm test          # repository standard-library self-tests
trellis eval      # toolkit self-tests plus configured project tests
npm run check     # single maintainer/release gate
```

Use `--ai` with the Trellis CLI for concise machine-readable progress. The eval
summary ends with:

```text
RESULT required_pass=<n> required_fail=<n> optional_pass=<n> optional_skip=<n> optional_warn=<n>
```

The command exits non-zero when `required_fail` is nonzero.

## Required evidence

The aggregate gate owns the repository self-tests and the configured structural
checks referenced by `package.json`. It includes public claim tests, package and
CLI contracts, generated-file drift checks, and documentation link/breadcrumb
verification. The exact list in the executable package scripts is authoritative.

When a supported project manifest exposes a configured project test command,
`trellis eval` executes it as project evidence. A present but broken test setup
is a failure with the underlying command and exit status.

## Optional evidence

Graphify, Bounds, Phoenix, and language-specific tools outside the core are not
assumed. Their state is classified as follows:

- not configured: `SKIP` plus the configuration action
- configured and ready: optional `PASS`
- configured but absent, stale, or invalid: `FAIL` plus a repair action
- executed but non-blocking by explicit policy: `WARN`

See [language support](./language-support.md) for tested command dispatch and
[SYSTEM.md](./SYSTEM.md) for the aggregate gate boundary.
