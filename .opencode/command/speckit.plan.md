---
phase: plan
description: Create the technical plan: architecture, contracts, risks, test strategy.
---

## Task

Read the clarified `spec.md`. Produce:

1. `plan.md` — architecture, data model, test strategy
2. `contracts.md` (or `contracts/` folder) — API contracts
3. `risks.md` — production hazards + mitigations

## Delegation (Tier 3)

If handoff loops are enabled, dispatch domain subagents in parallel:
- `api-routes` skill -> contracts
- `db-migrations` skill -> data model
- `frontend-ui` skill -> frontend sections of plan
- `security-review` skill -> risks

Each receives only the relevant FR/SC refs + template. Never the full spec.

## Rules

- No implementation code. This is architecture.
- ID-only references to spec requirements (FR-XXX).
- If Graphify is installed: `graphify query "how does <area> work?"` before designing.
- If Bounds is installed: `bounds describe <subsystem>` before touching shared code.
- Ponytail: the simplest architecture that satisfies the requirements wins. Mark expansions with `# trellis: full-impl, <reason>`.

## Next Phase

Hand off to `/tasks`.
