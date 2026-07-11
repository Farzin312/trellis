---
name: speckit-checklist
description: Validate specification and plan quality before solution analysis. Use after Tasks to complete required requirement and risk checklists; this phase evaluates artifacts, not implementation.
---

# Checklist

Create or complete `checklists/requirements.md`. Add a security and money
checklist when the feature touches trust boundaries, user data, permissions,
payments, secrets, or migrations. Add domain-specific checklists only when they
cover a real risk not already represented.

Check that requirements are testable, success criteria measurable, assumptions
visible, edge cases covered, contracts consistent, risks mitigated, and tasks
traceable. Unresolved required items block Analyze from passing.

Do not mark code correctness here; that belongs to Verify.

Next: `speckit-analyze`.
