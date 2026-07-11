---
name: speckit-implement
description: Execute an analyzed Trellis task list with test-first behavior changes and synchronized documentation. Use only after analysis.md records PASS.
---

# Implement

Execute `tasks.md` in dependency order. For each behavior task:

1. run the paired test and confirm it fails for the intended missing behavior;
2. implement the smallest sufficient change;
3. run the focused test, then relevant broader checks;
4. refactor only when evidence justifies it;
5. update task status and documentation.

Parallelize only tasks marked safe and give each owner task ID, paths, done
condition, and requirement references. Preserve unrelated user changes.

Do not silently change scope or architecture. If a task or contract is wrong,
update the owning artifact and re-run downstream gates. Record out-of-scope ideas
as follow-ups instead of implementing them.

After all tasks, run the repository's focused checks and any enabled boundary
validation.

Next: `speckit-review`.
