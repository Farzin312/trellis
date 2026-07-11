---
name: speckit-specify
description: Create or update a Trellis feature specification from a user outcome. Use at the start of non-trivial work or when requirements materially change.
---

# Specify

Read the constitution and current request. Create
`.specify/specs/<NNN>-<slug>/spec.md` from the spec template.

Capture user outcomes, functional requirements, success criteria, security and
validation constraints, invariants, edge cases, assumptions, and explicit
out-of-scope items. Give stable IDs to requirements that later artifacts cite.

Describe observable needs, not a chosen implementation. Mark material ambiguity
for Clarify and avoid inventing facts. Cross-check living docs against current
behavior when the request depends on them.

Next: `speckit-clarify`.
