---
name: speckit-verify
description: Produce empirical sign-off for a reviewed Trellis change. Use after Review to run configured gates, map evidence to success criteria, and distinguish complete, partial, and blocked proof.
---

# Verify

Read the spec success criteria, tasks, analysis, and review. Run the repository's
aggregate gate plus any feature-specific commands required by the plan. Continue
independent safe checks after failures to produce a complete picture.

Write `verify.md` with, for each criterion and command:

- command or inspection;
- exit status;
- relevant output or artifact;
- result: `PASS`, `FAIL`, `WARN`, or `SKIP`;
- remaining limitation or external proof owner.

Use `quality-gates` for the empirical sweep. Do not infer production behavior,
external service state, owner approval, or retroactive evidence from local green
commands. A skip is not a pass.

Set final status to `COMPLETE` only when all required criteria have evidence and
no blocking review item remains. Otherwise use `PARTIAL` or `BLOCKED` and state
the exact open condition.
