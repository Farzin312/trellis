---
name: speckit-tasks
description: Convert an approved Trellis plan into ordered, path-referenced work units with verification pairs. Use after Plan and before spec-quality checklists.
---

# Tasks

Read the plan, contracts, and risks. Produce `tasks.md` with stable task IDs,
exact target paths, requirement references, dependencies, and observable done
conditions.

Pair each behavior implementation with a test that fails for the intended reason
first. For documentation, generation, or operational work that cannot use a unit
test, define an explicit read-only verification command or inspection. Mark a task
parallel-safe only when it has no shared write ownership or unmet dependency.

Keep tasks small enough to verify independently, but do not split a single
invariant across owners. Include documentation and cleanup in the same delivery
chain.

Next: `speckit-checklist`, then `speckit-analyze`.
