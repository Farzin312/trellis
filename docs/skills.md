# Agent Skills

> Parent: [documentation index](./README.md)

Agent Skills package reusable instructions, references, and scripts behind a
`SKILL.md` entry point. Trellis uses one canonical project path and one generated
compatibility mirror.

## Source ownership

```text
.agents/skills/<name>/SKILL.md   canonical, hand-edited
        |
        +-> .claude/skills/<name>/SKILL.md   generated compatibility mirror
```

Do not hand-edit the Claude mirror. The generator updates only manifest-owned
mirror paths and does not delete an untracked Claude-only skill, but health fails
that split ownership: move the skill to `.agents/skills/` and regenerate.

## Compatibility

Compatibility reviewed: 2026-07-11.

| Agent | Project skill path used by Trellis | Evidence |
|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md` | [OpenAI Codex skills](https://learn.chatgpt.com/docs/build-skills) |
| OpenCode | `.agents/skills/<name>/SKILL.md` | [OpenCode Agent Skills](https://opencode.ai/docs/skills/) |
| GitHub Copilot | `.agents/skills/<name>/SKILL.md` | [GitHub Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |
| Claude Code | `.claude/skills/<name>/SKILL.md` | [Claude Code skills](https://code.claude.com/docs/en/skills) |

Platform discovery rules can change. Update the review date and public claim
tests when changing this table.

Codex initially budgets at most 8,000 characters when the model context size is
unknown for the available-skill list. Trellis's release test keeps the shipped
names and descriptions within that discovery budget; skill bodies remain
progressively loaded only when selected.

Codex needs no repository `.codex` directory for these skills: it reads the
shared `.agents/skills/` tree and `AGENTS.md`. Trellis does not generate legacy
custom-prompt or command mirrors. Claude is the only listed platform requiring a
separate project skill directory, so it is the only generated compatibility
copy.

Invocation syntax is a platform surface, not part of the Agent Skills file
format. Use `$skill-name` in Codex, `/skill-name` in Claude Code and Copilot CLI,
and a direct request or OpenCode's native skill tool in OpenCode. The portable
form is “Use the `skill-name` skill to …”.

## Minimum format

```markdown
---
name: docs-maintenance
description: Maintain documentation structure and accuracy. Use when editing docs.
---

# Documentation Maintenance

Instructions go here.
```

The directory name and `name` must match. Names use lowercase letters, digits,
and single hyphens. Descriptions state both the capability and when to load it.
References and scripts stay inside the skill directory and are loaded only when
needed.

## SDD skills

The nine directly invocable phase skills use the `speckit-<phase>` naming
pattern under `.agents/skills/`:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

Each phase skill owns its command behavior. The durable SDD policy lives in
[sdd/sdd.md](./sdd/sdd.md).

## Commands

```bash
npm run skills:generate  # regenerate the Claude mirror
npm run skills:health    # validate canonical skills and mirror drift
```

Missing, malformed, unsafe, or drifted canonical skills fail the health gate.
Specification-valid external skills may exceed the recommended 500-line
instruction budget; that produces a warning and should prompt progressive
disclosure through `references/`, not an incompatible 20KB hard failure. A 1MB
safety limit still prevents unbounded instruction files. Trellis's own shipped
skills remain under 20KB and 500 lines.

The bundled `trellis-setup` skill owns the AI-assisted installation interview.
Third-party cross-agent skills, such as Graphify's project-scoped `agents`
install, also belong in the canonical tree before mirror generation.
