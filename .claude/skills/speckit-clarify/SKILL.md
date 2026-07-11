---
name: speckit-clarify
disable-model-invocation: true
description: Drive targeted questions until ambiguity is materially resolved.
---

## Task

Read `.specify/specs/<NNN>-<slug>/spec.md`. Identify every ambiguity, gap, or unstated assumption. Ask targeted questions one at a time (when the user is actively answering) or in a batch (when the user prefers).

## Rules

- No arbitrary cap on questions. Ask as many as needed.
- Prefix each question with the source location: `**Found in**: path/to/file.ts:line — <note>`
- Update `spec.md` § Clarification Log with each answer.
- Clarification stops when: ambiguity is materially resolved, the user explicitly stops, or additional questions are low-value.
- Do not design solutions during Clarify. That is Plan's job.

## Next Phase

Invoke `speckit-plan`.
