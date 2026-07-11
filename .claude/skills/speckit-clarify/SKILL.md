---
name: speckit-clarify
description: Resolve material ambiguity in a Trellis feature specification. Use after Specify or whenever an unanswered choice would materially change scope, behavior, risk, or acceptance.
---

# Clarify

Read `spec.md` and identify only ambiguities that affect scope, observable
behavior, security, data integrity, compatibility, or acceptance.

Resolve from repository evidence when possible. Ask concise targeted questions
only when the answer cannot be discovered safely; otherwise state the bounded
assumption and rationale. Record every resolution in the spec's clarification
log and update affected requirements.

Do not design the solution. Stop when remaining uncertainty is low-risk or
explicitly deferred.

Next: `speckit-plan`.
