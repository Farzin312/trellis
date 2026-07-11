---
name: skill-evolution
description: Create, revise, consolidate, or retire repository Agent Skills based on repeated workflow evidence. Use when an existing skill was wrong or incomplete in real use, or at least three similar tasks reveal a stable reusable procedure.
---

# Skill evolution

Prefer revising an existing skill over adding an overlapping one. Create a skill
only when the procedure is recurring, non-obvious, and has clear trigger language.

1. Collect concrete task evidence and identify the reusable procedure or failure.
2. Search `.agents/skills/` for overlap and choose revise, merge, create, or delete.
3. Keep `SKILL.md` concise. Put all trigger conditions in the frontmatter
   description and use only `name` and `description` fields.
4. Include only instructions another capable agent would not reliably infer.
   Add scripts or one-level references only when repetition or fragility warrants
   them.
5. Edit `.agents/skills/<name>/SKILL.md`, update routing references, and run
   `npm run skills:generate` to update the Claude compatibility mirror.
6. Run `npm run skills:health` and a realistic forward test when practical.

Generation is explicit; skills do not self-modify or sync in the background.
Retire obsolete skills and their references rather than preserving compatibility
copies without a current consumer.

Return the evidence, decision, canonical paths changed, validation output, and
any forward-test limitation.
