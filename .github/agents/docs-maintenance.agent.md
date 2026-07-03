---
name: docs-maintenance
description: |
  Maintain documentation structure, breadcrumbs, indexes, and doc-code
  accuracy. Use when adding, updating, or removing any documentation
  files. Auto-loads when file paths match docs/** or when editing
  AGENTS.md, CLAUDE.md, README.md, or CREDITS.md.
version: 1.0.0
---

# Documentation Maintenance

## Overview

Update docs without breaking the parent-child tree, keep generated
indexes aligned with code, and maintain doc-code accuracy. Works for
any documentation structure.

## Documentation Rules

1. **Single owner per topic** - each concept has ONE authoritative doc.
   Other docs link to it; they don't restate it.
2. **Parent-child breadcrumbs** - every doc (except top-level indexes)
   has a `> Parent: [link]` breadcrumb. CI enforces this.
3. **Retrieval flow** - mandate file -> system README -> subsystem doc ->
   followed reference. Never jump to a reference bank directly.
4. **Doc-code accuracy** - when code changes, update doc references in
   the same commit. `npm run docs:sync` is the safety net, not the
   primary mechanism.
5. **Bug-fix doc contract** - every production bug fix gets a
   `docs/bug-fixes/YYYY-MM-DD-<slug>.md` entry with frontmatter
   (`area`, `category`, `severity`).
6. **No hand-edited generated docs** - if a doc is auto-generated (by
   docs-sync.mjs or another script), never edit it by hand. Edit the
   source and regenerate.
7. **Tone** - clean product language. No "gap", "blind spot", "audit",
   or internal jargon. Write for external users.

## Workflow

1. Identify what doc(s) the code change affects.
2. Update the doc(s) in the same commit as the code change.
3. Add or update breadcrumbs if the doc structure changed.
4. Run: `npm run docs:check` (read-only verification).
5. If adding a new doc: add it to the parent's child list or index.

## When to Load

Load this skill when:
- Editing anything under docs/
- Adding or removing doc files
- The delegation matrix routes you here

## Output Expectations

Return:
- List of all updated doc paths
- Any required regeneration commands
- Breadcrumb changes made
