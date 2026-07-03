# Skills: How to Create Them for Every AI Agent

> Parent: `docs/README.md`

A SKILL is a modular capability an AI agent loads on demand. Skills are
different from slash commands (which are one-shot prompt templates) and
different from mandate files (which are always-on). Skills are the middle
layer: loaded when relevant, unloaded when not.

Trellis uses the Anthropic Agent Skills format (SKILL.md), which is an open
cross-tool standard adopted by Claude Code, Codex, OpenCode, Copilot, and
others.

---

## The SKILL.md Format (Single Source of Truth)

Every skill is a directory with a SKILL.md file:

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              ← required: frontmatter + instructions
    ├── references/           ← optional: deep docs loaded on demand
    │   └── api-details.md
    ├── scripts/              ← optional: executable helpers
    │   └── validate.sh
    └── assets/               ← optional: templates, data files
        └── template.yaml
```

### SKILL.md Structure

```markdown
---
name: my-skill
description: |
  What this skill does and when to use it. Keep under 1024 chars.
  The description is what the agent reads to decide whether to load this skill.
  Include trigger conditions: "Use when X, Y, or Z."
version: 1.0.0
---

# My Skill

## When to Load

Load this skill when the task involves:
- Condition 1
- Condition 2

## Instructions

Step-by-step guidance the agent follows once the skill is loaded.

## References

References are loaded on demand. See docs/skills.md for the full pattern.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase + hyphens, max 64 chars, MUST match directory name |
| `description` | Yes | Max 1024 chars. What it does + when to use it. This is the trigger. |
| `version` | No | Semantic version |
| `license` | No | License if the skill is redistributable |
| `metadata` | No | Arbitrary key-value metadata |

### Progressive Disclosure (Token Efficiency)

Skills are designed to minimize context cost:

1. **Metadata** (~100 tokens) — name + description loaded at startup for ALL skills
2. **Instructions** (< 5000 tokens recommended) — loaded when skill activates
3. **References** — loaded ONLY when the agent explicitly reads them
4. **Scripts** — executed ONLY when the agent explicitly runs them

This means you can ship 50 skills in a project and agents only pay the token
cost for the ones they use.

---

## Where Skills Live (Cross-Tool)

Trellis uses `.agents/skills/` as the single source of truth. Each platform
discovers skills from its own directory, so init.sh creates symlinks or copies.

```
.agents/skills/my-skill/SKILL.md      ← SOURCE (edit this)
.claude/skills/my-skill/              ← symlink for Claude Code
.codex/agents/my-skill/               ← copy for Codex (no symlink support)
.opencode/command/my-skill.md         ← copy for OpenCode
.github/agents/my-skill.agent.md      ← copy for Copilot
```

### Per-Platform Discovery

| Platform | Skill Directory | Format | Symlink Support |
|----------|----------------|--------|-----------------|
| Claude Code | `.claude/skills/<name>/SKILL.md` | SKILL.md | Yes |
| Codex CLI | `.codex/agents/<name>/` or via `skills` config | SKILL.md | No (copy) |
| OpenCode | `.opencode/command/<name>.md` | Flat markdown | No (copy) |
| GitHub Copilot | `.github/agents/<name>.agent.md` | Agent markdown | No (copy) |
| Any `.agents/` reader | `.agents/skills/<name>/SKILL.md` | SKILL.md | Direct |

### The generate-commands.mjs Pattern

Trellis already generates slash command mirrors from `.specify/templates/commands/`.
The same pattern extends to skills:

```bash
# After creating a skill in .agents/skills/<name>/SKILL.md:
node scripts/generate-skills.mjs

# This symlinks/copies to all platform directories.
# CI gate: check-skill-sync.mjs verifies all platforms match source.
```

---

## Creating a New Skill (Step by Step)

### 1. Create the source

```bash
mkdir -p .agents/skills/my-skill
```

Write `.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: |
  Validates API route structure against the 8-step discipline.
  Use when writing or reviewing code under app/api/**, or when the user
  asks to "check route structure" or "verify API discipline".
version: 1.0.0
---

# API Route Discipline Checker

## When to Load

Load when:
- Writing a new route under app/api/
- Reviewing a PR that touches app/api/
- The user mentions "route structure", "API discipline", or "8-step"

## Instructions

1. Read the route file
2. Verify the 8-step sequence:
   - Authentication
   - Status check
   - Role check
   - Rate limiting
   - Input validation
   - Database operation
   - Audit log
   - Response
3. Flag any missing or reordered steps
4. Suggest the correction
```

### 2. Add references (optional)

```bash
mkdir -p .agents/skills/my-skill/references
```

Write `.agents/skills/my-skill/references/examples.md` with detailed examples.
The agent loads this ONLY when it needs them.

### 3. Add a script (optional)

```bash
mkdir -p .agents/skills/my-skill/scripts
```

Write `.agents/skills/my-skill/scripts/check.sh`. The agent executes this
when it needs automated verification.

### 4. Mirror to all platforms

```bash
node scripts/generate-skills.mjs
```

Or manually:
- Claude Code: `ln -s ../../.agents/skills/my-skill .claude/skills/my-skill`
- Codex: `cp -r .agents/skills/my-skill .codex/agents/my-skill`
- OpenCode: `cp .agents/skills/my-skill/SKILL.md .opencode/command/my-skill.md`
- Copilot: `cp .agents/skills/my-skill/SKILL.md .github/agents/my-skill.agent.md`

### 5. Register in AGENTS.md

Add a row to the skill table in AGENTS.md so agents know it exists:

```markdown
| `my-skill` | When writing or reviewing API routes |
```

---

## Skills vs Commands vs Mandate

| Layer | When It Loads | Token Cost | Example |
|-------|--------------|------------|---------|
| Mandate (AGENTS.md) | Always (every session) | Full file, every turn | "Code is source of truth" |
| Command (slash) | When user types /command | Full prompt on invocation | /specify, /plan |
| Skill | When agent decides it's relevant | Metadata always; body on activation | api-routes, security-review |

Use skills for capabilities an agent MIGHT need. Use commands for workflows
the user explicitly triggers. Use the mandate for rules that always apply.

---

## Skills That Ship With Trellis (Built-In)

Trellis defines these skills in `.agents/skills/` (created on first use or
by init.sh):

| Skill | When | What |
|-------|------|------|
| `sdd` | Non-trivial change | Drives the SDD flow end-to-end |
| `api-routes` | Writing app/api/** | 8-step discipline, JSDoc, contracts |
| `db-migrations` | Writing migrations | RLS, FK rules, tool-specific patterns |
| `docs-maintenance` | Editing docs/** | Breadcrumbs, structure rules, doc-drift |
| `security-review` | Auth/money/RLS surfaces | Audit checklist, threat modeling |
| `quality-gates` | Pre-merge | Lint, build, test, mutation verification |
| `ponytail-review` | Review phase | Over-engineering flags (advisory) |

These are registered in the handoff registry (`.agents/handoffs/registry.yaml`)
so the handoff engine can delegate to them automatically.

---

## Validation

Skills can be validated against the format spec:

```bash
npx skills-ref validate .agents/skills/my-skill
```

This checks:
- `name` matches directory name
- `name` is lowercase + hyphens, max 64 chars
- `description` is present and under 1024 chars
- No syntax errors in frontmatter
