# Tasks: <feature name>

> Spec: <NNN>

Tasks are ordered, path-referenced, and independently verifiable. Pair each
behavior implementation with a test that fails for the intended reason first.

| ID | Task | Type | Files | Refs | Deps | Parallel? |
|---|---|---|---|---|---|---|
| T001 | [TEST] Prove <behavior> | test | `<test path>` | FR-001 | — | — |
| T002 | Implement <behavior> | impl | `<source path>` | FR-001 | T001 | — |
| T003 | Verify <documentation or operation> | verify | `<target path>` | SC-001 | T002 | — |

Markers:

- `[TEST]` means observe the intended failure before implementation.
- `[P]` means no shared write ownership or unmet dependency; parallel execution
  is safe.
- Every dependency ID must complete before the dependent task starts.
