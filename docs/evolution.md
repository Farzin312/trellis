# Deterministic Adaptation

> Parent: [documentation index](./README.md)

Trellis adaptation is explicit and reviewable. There is no background evolution
agent, scheduled policy rewrite, or unattended skill creation.

## Project adaptation

```bash
trellis evolve
trellis evolve --stack=typescript,python
```

The command re-runs the same validated stack and project-identity adaptation used
by initialization. It writes only Trellis-owned configuration and generated
content. Unsupported stack values and conflicting identity data fail with a
concrete message.

## Skill health

```bash
npm run skills:health
```

The health check validates canonical `.agents/skills/` metadata, names, size,
references, direct SDD invocation, and generated `.claude/skills/` drift. It does
not decide that a new skill is needed.

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
