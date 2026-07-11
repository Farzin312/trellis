---
name: speckit-analyze
disable-model-invocation: true
description: Post-task solution audit. The hard gate before any code is written.
---

## Task

Read the full artifact chain (spec, plan, contracts, risks, tasks). Audit:

1. Does the plan satisfy every FR/SC/AUTH/VAL requirement?
2. Are contracts internally consistent?
3. Are risks mitigated?
4. Are tasks complete and correctly ordered?
5. Does the test strategy cover the requirements?

Produce `analysis.md` with `Result: PASS` or `Result: FAIL`.

## Rules

- If `Result: FAIL`, implementation MUST NOT begin. Return to the failing phase.
- If Bounds is installed: `bounds validate --quick` MUST exit clean before PASS.
- Security or money audits delegate to `security-review` when subagents are available.

## Next Phase

If PASS, invoke `speckit-implement`. If FAIL, return to the flagged phase.
