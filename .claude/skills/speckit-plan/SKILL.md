---
name: speckit-plan
description: Design the technical solution, contracts, risks, and test strategy for a clarified Trellis specification. Use after Clarify and before task decomposition.
---

# Plan

Read the clarified spec and relevant current architecture. Produce:

- `plan.md`: architecture, ownership, data flow, rollout, and test strategy;
- `contracts.md` or `contracts/`: changed public interfaces and errors;
- `risks.md`: failure modes, mitigations, detection, and recovery.

Trace decisions to requirement IDs without restating the whole spec. Prefer the
smallest design satisfying demonstrated needs and existing conventions. Identify
compatibility, concurrency, idempotency, security, migration, and operational
risks as applicable.

Use configured discovery or boundary tools before shared-code design. Delegate
independent domain analysis with only relevant requirements and paths. Do not
write production implementation code in this phase.

Next: `speckit-tasks`.
