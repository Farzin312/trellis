# Agent routing guide

> Parent: [documentation index](./README.md)

Use this page to retrieve the minimum context needed for a task. Do not load the
entire documentation tree by default.

## Start here

1. Read the root [`AGENTS.md`](../AGENTS.md) mandate.
2. Read [documentation structure](./STRUCTURE.md) before changing docs.
3. For non-trivial work, read the [SDD contract](./sdd/sdd.md) and the matching
   Agent Skill under `.agents/skills/`.
4. Read [coding standards](./coding-standards.md) before implementation.
5. Follow the relevant subsystem link from [systems/README.md](./systems/README.md).

The stable phase order is:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

## Retrieval rules

- Prefer a subsystem index over broad source reading.
- Treat `.specify/specs/` as point-in-time delivery evidence, not current API
  documentation.
- Treat code and executable checks as current behavior; update living docs when
  they drift.
- Use Graphify or Bounds only when `.trellis/config.json` enables them.
- Run `npm run check` before claiming completion and report every skip or open
  external proof honestly.

Trellis does not configure application authentication or other adopting-project
trust boundaries. Load `security-review` whenever those surfaces are touched.
