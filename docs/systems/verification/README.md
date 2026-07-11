# Verification

> Parent: [Trellis system documentation](../README.md)

## Ownership

Verification owns the single aggregate gate, framework self-tests, configured
project-gate and fallback test dispatch, documentation structure checks, optional-integration
readiness, migration static warnings, and release/scaffold smoke evidence.

## Public Surface

- `npm run check`
- `npm test` and `trellis eval`
- `npm run docs:check`
- `npm run check:integrations` and `npm run check:migrations`
- `PASS`, `FAIL`, `WARN`, and `SKIP` result semantics

## Private internals

Fixture construction and release-only assertions under `.trellis/tests/` are
maintainer details. Generated projects receive only portable framework tests.

## Dependencies and dependents

The gate reads package metadata, configuration, canonical guidance, generated
skills, docs, migration evidence, and optional-tool output. CI invokes only the
aggregate gate.

## Invariants and trust boundaries

Required failures determine the exit status. A skip or warning never increments
the pass count. Static structure checks do not claim runtime, production, or
external-service proof.

## Failure and operation

Independent safe checks continue after local failures where practical so the
final report is complete. Configured optional integrations fail when unavailable
or ineffective; unconfigured integrations report explicit skips.

## Verification

The full standard-library suite is `.trellis/tests/*.test.mjs`; the clean
generated-project proof is `scaffold-smoke.test.mjs`.
