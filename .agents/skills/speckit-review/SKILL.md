---
name: speckit-review
disable-model-invocation: true
description: Post-implementation review. Catch implementation drift and coding standards violations.
---

## Task

After Implement, before Verify: review every changed file against the coding standards canon (`docs/coding-standards.md`).

Produce a `review.md`-style report covering:

1. **Standards compliance** — guard clauses, error handling, TypeScript discipline, naming, state machines, idempotency, race-condition prevention.
2. **Pattern compliance** — no duplication, reuse of established primitives, design system tokens.
3. **Scope compliance** — no additions beyond tasks.md. Out-of-scope changes logged as follow-ups.
4. **Security** — auth checks, RLS, money-path safety, rate limiting, audit logging.
5. **Ponytail signals** — flag potential over-engineering (advisory, non-blocking). One-implementation abstractions, premature config, unjustified file size.

## Rules

- Every changed file gets reviewed. No exceptions.
- Security/money findings are BLOCKING. Ponytail findings are ADVISORY.
- If Graphify is installed: query the graph to verify no forbidden cross-boundary imports were introduced.
- If Bounds is installed: `bounds validate --quick` before reporting.

## Delegation

If handoff loops are enabled, this runs as the `ponytail-review` specialist (advisory) plus a blocking standards check.

## Next Phase

Invoke `speckit-verify`.
