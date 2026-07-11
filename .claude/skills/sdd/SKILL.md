---
name: sdd
description: Drive a non-trivial repository change through Trellis's nine-phase spec-driven development workflow. Use for behavior changes, multi-file work, new public surfaces, security-sensitive changes, or resuming an existing .specify/specs feature chain.
---

# Spec-driven development

Use this order without skipping forward:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

Store the chain under `.specify/specs/<NNN>-<slug>/`. Read
`.specify/memory/constitution.md` and `docs/sdd/sdd.md` first.

| Phase | Skill | Evidence |
|---|---|---|
| Specify | `speckit-specify` | `spec.md` |
| Clarify | `speckit-clarify` | clarification log in `spec.md` |
| Plan | `speckit-plan` | `plan.md`, contracts, risks |
| Tasks | `speckit-tasks` | `tasks.md` |
| Checklist | `speckit-checklist` | `checklists/*.md` |
| Analyze | `speckit-analyze` | `analysis.md` with PASS or FAIL |
| Implement | `speckit-implement` | tests, code, docs, task status |
| Review | `speckit-review` | `review.md` |
| Verify | `speckit-verify` | `verify.md` and final status |

Do not write implementation code before Analyze passes. If evidence changes the
requirements or architecture, update the earlier artifact and re-run downstream
gates rather than silently re-planning.

Delegate bounded independent work by task ID, target paths, done condition, and
requirement references. Give specialists only the relevant artifact excerpts and
return compact evidence. Parallelize only tasks without shared write ownership.

Respect documented subsystem public/private boundaries. Use Graphify or Bounds
only when `.trellis/config.json` enables them; tool absence cannot block an
unconfigured core workflow.

Completion requires empirical local gates plus honest separation of external
proof, production configuration, and owner decisions.
