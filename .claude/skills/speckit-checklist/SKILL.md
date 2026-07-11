---
name: speckit-checklist
disable-model-invocation: true
description: Fill spec-quality checklists before Analyze. Validates the spec is complete, not the code.
---

## Task

Fill the required checklists before Analyze runs. These validate SPEC QUALITY — not code correctness.

| Checklist | Required? | When |
|-----------|-----------|------|
| `checklists/requirements.md` | **Always** | After Tasks, before Analyze |
| `checklists/security-and-money.md` | When spec touches auth, money, audit, or migrations | After Tasks, before Analyze |
| Additional domain checklists | Suggested for complex features | Before Analyze |

## Rules

- Incomplete required checklists block `analysis.md` from reaching `Result: PASS`.
- Checklists validate the spec and plan quality BEFORE code is written.
- `verify.md` validates implementation AFTER code is done. Different phases, do not merge.

## Next Phase

Invoke `speckit-analyze`.
