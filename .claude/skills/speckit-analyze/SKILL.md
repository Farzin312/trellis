---
name: speckit-analyze
description: Audit the complete pre-implementation Trellis artifact chain for contradictions, missing coverage, unsafe assumptions, and infeasible tasks. Use as the hard gate before writing code.
---

# Analyze

Read the spec, clarification log, plan, contracts, risks, tasks, and required
checklists. Verify that every requirement and success criterion has a coherent
design and task, contracts agree, risks have mitigations, and tests cover the
important failure paths.

Build a traceability matrix from each requirement and success criterion through
its clarification, design/contract, risk, task, failing test, and verification
method. Inspect current code and run read-only feasibility commands where a plan
assumes an existing path, API, tool, or behavior. Check for contradictions,
duplicates, unreachable tasks, unsafe sequencing, missing negative cases,
unsupported claims, and needless complexity.

Check boundary ownership and security assumptions using configured tools where
applicable. Do not require an optional tool that the project has not enabled.

Do not merely report a fixable artifact defect. Repair the owning artifact in
Specify, Plan, Tasks, or Checklist, update every downstream reference, and
re-run Analyze from the beginning. If repair requires an owner decision, return
to Clarify and ask it in A/B/C/D format with a recommendation. Analyze must not write
implementation code.

Write `analysis.md` from the analysis template with the final traceability
matrix, repaired findings, remaining blockers, and `Result: PASS` or `Result:
FAIL`. PASS describes the post-repair chain, not the first draft. FAIL is only
for a genuine unresolved decision or infeasible requirement and names the owner,
artifact, and phase required to resume. Implementation must not begin until the
updated chain passes again.

Next after PASS: `speckit-implement`.
