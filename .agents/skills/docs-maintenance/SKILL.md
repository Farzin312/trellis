---
name: docs-maintenance
description: Maintain living documentation, routing indexes, breadcrumbs, local links, and doc-code accuracy. Use when editing README, AGENTS.md, CLAUDE.md, docs/**, examples, command references, support claims, or documented symbols.
---

# Documentation maintenance

1. Identify the one living owner for each changed concept; link to it elsewhere.
2. Keep adopter setup, maintainer internals, generated guidance, and historical
   evidence in their documented sections.
3. Add a `> Parent:` breadcrumb to each non-exempt file under `docs/` and route it
   from the parent's index.
4. Verify every command, path, option, example, compatibility label, and license
   statement against current executable or authoritative evidence.
5. Update references with renamed, moved, or deleted code in the same change.
6. Edit canonical sources only. `.agents/skills/` owns `.claude/skills/`, and
   `AGENTS.md` owns the `CLAUDE.md` import contract.
7. Run `npm run docs:check`; it validates structure and local links but does not
   prove prose accuracy.

Create a bug-fix entry only for meaningful behavior, reliability, security, or
user-facing regressions. Do not expose internal audit chatter as adopter copy;
state capabilities and limits directly.

Return changed doc paths, owning-source decisions, links or breadcrumbs changed,
and verification output.
