---
name: speckit-analyze
description: Audit the complete pre-implementation Trellis artifact chain for contradictions, missing coverage, unsafe assumptions, and infeasible tasks. Use as the hard gate before writing code.
---

# Analyze

Read the spec, clarification log, plan, contracts, risks, tasks, and required
checklists. Verify that every requirement and success criterion has a coherent
design and task, contracts agree, risks have mitigations, and tests cover the
important failure paths.

Check boundary ownership and security assumptions using configured tools where
applicable. Do not require an optional tool that the project has not enabled.

Write `analysis.md` with findings, traceability gaps, and `Result: PASS` or
`Result: FAIL`. A failure names the artifact and phase that must be repaired.
Implementation must not begin until the updated chain passes again.

Next after PASS: `speckit-implement`.
