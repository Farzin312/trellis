---
name: speckit-tasks
disable-model-invocation: true
description: Break the plan into atomic, path-referenced work units with [TEST] pairs.
---

## Task

Read `plan.md`, `contracts.md`, `risks.md`. Produce `tasks.md`:

- Atomic tasks (one file, one concern per task)
- Each implementation task has a paired `[TEST]` task that runs to failure first
- Path-referenced (exact file paths)
- Ordered by dependency
- `[P]` marker on parallel-safe tasks
- TXXX IDs, FR/SC refs

## Rules

- Never skip the `[TEST]` pair. TDD is non-negotiable.
- Tasks are "done when" statements — the agent should know unambiguously when a task is complete.
- No task should require the agent to guess a file path or contract shape.
- If Bounds is installed: `bounds where <symbol>` to verify file paths before writing them.

## Next Phase

Invoke `speckit-checklist`, then `speckit-analyze`.
