# Deterministic Adaptation

> Parent: [documentation index](./README.md)

Trellis adaptation is explicit and reviewable. There is no background evolution
agent, scheduled policy rewrite, or unattended skill creation.

## Project adaptation

```bash
trellis evolve
trellis evolve --stack=typescript,python
```

The command re-runs validated stack detection, updates the Trellis stack config,
and refreshes only the marked project-scope sentence in `AGENTS.md`. It does not
rename the project or edit Graphify, Bounds, application, or other external-tool
configuration. Unsupported stack values and invalid Trellis configuration fail
with a concrete message.

## Skill health

```bash
npm run skills:health
```

The health check validates canonical `.agents/skills/` metadata, names, a 1MB
safety bound, manifest inventory, symlinks, file parity, and generated
`.claude/skills/` drift. Instructions over the Agent Skills 500-line
recommendation warn rather than fail, while Trellis-owned release skills retain
stricter compact budgets. The aggregate test suite
separately validates the complete SDD phase inventory and order. Neither check
decides that a new skill is needed.

## When to change guidance

Change a skill or mandate only when current evidence shows the instruction is
missing, incorrect, or repeatedly needed. Treat that as a normal repository
change:

1. add or update a failing deterministic check where practical;
2. edit the canonical source;
3. regenerate owned compatibility files;
4. run `npm run check`;
5. record production-affecting fixes in the bug-fix register.

Historical explanations belong in `docs/bug-fixes/` or a completed spec, not in
this living behavior reference.
