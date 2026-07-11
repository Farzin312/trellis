---
name: speckit-specify
disable-model-invocation: true
description: Create or update the feature specification from a natural language feature description.
---

## Outline

The current user request is the feature description.

1. Generate a concise short name (2-4 words) for the branch.
2. Create `.specify/specs/<NNN>-<slug>/spec.md` from the spec template.
3. Extract Functional Requirements (FR-XXX), Security (SC-XXX), Auth (AUTH-XXX), Validation (VAL-XXX), Invariants (INV-XXX), Edge Cases (EDGE-XXX) from the description.
4. Flag any ambiguity for the Clarify phase — do not resolve it here.
5. List out-of-scope items explicitly.

## Rules

- No solution language in the spec. Describe the problem and requirements, not the implementation.
- ID-only references. No prose restatement.
- Read the constitution (`.specify/memory/constitution.md`) before writing requirements.
- Cross-check any existing docs against current code (doc-drift detection).
- Ponytail: do not over-specify. The simplest spec that captures the requirement wins.

## Next Phase

Invoke `speckit-clarify`, then `speckit-plan`.
