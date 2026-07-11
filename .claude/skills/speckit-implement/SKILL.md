---
name: speckit-implement
disable-model-invocation: true
description: Execute tasks in order. TDD: [TEST] first, then implementation.
---

## Task

Execute `tasks.md` in order. For each task:

1. Run the paired `[TEST]` task — it MUST fail (Red).
2. Write the minimum implementation to pass (Green).
3. Refactor if needed.

## Delegation

If handoff loops are enabled, dispatch by file path:
- `app/api/**` -> `api-routes` skill
- `app/**` / `components/**` (non-API) -> `frontend-ui` skill
- `supabase/migrations/**` -> `db-migrations` skill
- `docs/**` -> `docs-maintenance` skill

Each subagent receives only: task ID, done-when, file paths, FR/SC refs.

## Rules

- No silent re-planning. If a task is wrong, stop and return to Plan/Tasks.
- No additions beyond task scope. Log out-of-scope ideas as follow-ups.
- After implementation: `bounds calibrate && bounds validate --quick` (if installed).
- Run `npm run lint` before reporting done. Must exit 0.
- Ponytail: write the minimum code that works. Mark simplifications and expansions.

## Next Phase

Invoke `speckit-review`, then `speckit-verify`.
