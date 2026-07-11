# Spec-driven development

> Parent: [agent routing guide](../README-FOR-AGENTS.md)

SDD turns a request into auditable requirements, implementation tasks, review,
and empirical proof. Non-trivial work uses this stable order:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

Each phase is a directly invocable Agent Skill at
`.agents/skills/speckit-<phase>/SKILL.md`. Store one feature chain under
`.specify/specs/<NNN>-<slug>/`.

## Phase contract

| Phase | Required outcome |
|---|---|
| Specify | User outcomes, functional requirements, success criteria, and boundaries |
| Clarify | Material ambiguities resolved or explicitly constrained |
| Plan | Architecture, contracts, risks, and test strategy |
| Tasks | Ordered, path-referenced units with test/implementation pairs |
| Checklist | Spec quality validated before solution analysis |
| Analyze | Cross-artifact contradictions and unsafe gaps resolved before code |
| Implement | Tests fail for the intended reason, then the smallest sufficient code passes |
| Review | Implementation drift, boundary violations, security gaps, and excess complexity addressed |
| Verify | Commands run from a clean-enough state; results and unresolved external proof recorded |

Clarify resolves undiscoverable material choices in reviewable batches of one
to three A/B/C/D options, each with a recommendation and consequence. It keeps
asking further batches until material ambiguity is resolved; the format is not
a cap on the total number of necessary questions.

Analyze is an active pre-code repair gate. It builds end-to-end traceability,
repairs fixable spec/plan/task/checklist defects in their owning artifacts, and
re-runs itself. It returns to Clarify for a real owner decision and never fixes
an artifact gap by writing implementation code early.

## Gates

Do not implement before Analyze passes. Do not claim completion before Verify
records command, exit status, and relevant output. A local green gate cannot
prove production configuration, owner approval, or external behavior; leave
those items open rather than inferring them.

A behavior-neutral one-file edit may use the mandate's trivial-change escape
hatch. Security-sensitive work always uses the full chain.
