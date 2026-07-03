# Tasks: <Feature Name>

> Spec: NNN

Tasks are atomic, path-referenced, and ordered. Each implementation task has a paired `[TEST]` task.

| ID | Task | Type | Files | Refs | Deps | Parallel? |
|----|------|------|-------|------|------|-----------|
| T001 | [TEST] Write test for X | test | tests/unit/x.test.ts | FR-001 | — | — |
| T002 | Implement X | impl | lib/x.ts | FR-001 | T001 | — |
| T003 | [TEST] Write API test for Y | test | tests/api/y.test.ts | FR-002 | — | [P] |
| T004 | Implement API route Y | impl | app/api/y/route.ts | FR-002 | T003 | [P] |

Markers:
- `[TEST]` — test task, runs to failure before implementation
- `[P]` — parallel-safe, can dispatch concurrently with other [P] tasks
- TXXX in Deps column must complete before this task starts
