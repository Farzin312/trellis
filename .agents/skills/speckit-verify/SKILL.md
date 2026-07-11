---
name: speckit-verify
disable-model-invocation: true
description: Empirical sign-off. Tests pass, routes correct, docs synced, graph parity.
---

## Task

Verify the implementation empirically. Produce `verify.md`:

1. `npm run test` — full suite passes. Count MUST NOT decrease.
2. `npm run lint` — exits 0.
3. `npm run build` — succeeds.
4. `npm run docs:check` — no drift.
5. `npm run test:mutation` — mutation score meets threshold (if configured).
6. Route audit — all new routes follow the 8-step discipline.
7. Bounds validate — exits clean (if installed).

Every item MUST be marked `[X]` with empirical evidence (test output, command output, doc-check output).

## Rules

- No item flips to `[X]` without evidence.
- Halt on first failure.
- SDD Status flips to COMPLETE only when all items pass.

## SDD Status

- [ ] All tests pass (full suite, count not decreased)
- [ ] Lint exits 0
- [ ] Build succeeds
- [ ] Docs synced (npm run docs:check passes)
- [ ] Mutation score meets threshold (if configured)
- [ ] Route audit complete
- [ ] Bounds validate clean (if installed)

**SDD Status: COMPLETE / BLOCKED**
