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

Ask one to three related questions per batch so answers remain easy to review.
There is no arbitrary total-question cap: continue with further batches until
every material ambiguity is resolved, delegated, or explicitly deferred. Use
this format for each choice:

```text
Q<ID>. <one concrete decision question>
A. <option and consequence>
B. <option and consequence>
C. <option and consequence>
D. Other — provide a different answer
Recommended: <letter> — <evidence, rationale, and trade-off>
```

Options must be mutually distinguishable and grounded in repository evidence.
Do not hide a required answer behind a default. If the owner delegates the
choice, take the recommended option and record that delegation. If none of A/B/C
fits, use the D answer as the resolution; do not force it into an inaccurate
choice.

After every answer, update the clarification log with question ID, selected
answer, evidence or owner source, rationale, and affected requirement IDs. Then
re-scan the complete spec because one answer can expose another ambiguity.

Do not design the solution. Stop only when remaining uncertainty is low-risk or
explicitly deferred with an owner and consequence.

Next: `speckit-plan`.
