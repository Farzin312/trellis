# Guidance

> Parent: [Trellis system documentation](../README.md)

## Ownership

Guidance owns durable cross-agent instructions, reusable Agent Skills, the
nine-phase SDD contract, generic engineering policy, and the generated Claude
compatibility mirror.

## Public Surface

- `AGENTS.md` and the one-line `CLAUDE.md` import
- `.agents/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`
- `.specify/memory/constitution.md` and `.specify/templates/`
- `docs/README-FOR-AGENTS.md` and `docs/sdd/sdd.md`

## Private internals

`.claude/skills/` is generated and never hand-edited. Active feature artifacts
under `.specify/specs/` are point-in-time evidence, not reusable policy.

## Dependencies and dependents

The control plane generates the Claude mirror. The verification subsystem checks
frontmatter, file parity, mandate import, documentation links, and stack-neutral
durable guidance.

## Invariants and trust boundaries

`.agents/skills/` is the only hand-edited skill tree. Durable guidance remains
stack-neutral and does not claim to configure application trust boundaries.

## Failure and operation

Malformed or drifted skills block the aggregate gate. A platform compatibility
change requires current authoritative evidence plus regenerated paths and tests.

## Verification

See `.trellis/tests/skills.test.mjs`, `sdd-skills.test.mjs`,
`mandate.test.mjs`, `agnostic.test.mjs`, and `public-docs.test.mjs`.
