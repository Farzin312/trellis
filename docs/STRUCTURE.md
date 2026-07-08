# Documentation Structure & Rules

> Parent: `docs/README.md`
> Audience: every contributor — human and AI agent.

This file is the single source of truth for how documentation works. Every other place (AGENTS.md, docs/README.md, docs/README-FOR-AGENTS.md, every domain README) refers back here.

## Rule 1 — Retrieval principle: system folders are the root

Every domain gets its own folder under `docs/systems/`. The folder's `README.md` is the lifecycle map. Flat `<subsystem>.md` files are deep docs.

The retrieval flow is always: mandate file (AGENTS.md) -> system-folder README -> subsystem doc -> followed reference.

## Rule 2 — Subsystem doc structure (14 sections)

Every `docs/systems/<domain>/<subsystem>.md` follows the template at `docs/_subsystem-template.md`.

## Rule 3 — Domain README structure

Each `docs/<domain>/README.md` is a step-by-step walkthrough of every functional flow, across every role.

## Rule 4 — Bug-fix categorization

Every fix gets a frontmatter-categorized entry in `docs/bug-fixes/`. Auto-pulled into subsystem docs.

## Rule 5 — Parent -> children breadcrumbs

Every doc opens with `> Parent:` and optional `> Children:`. All links relative. CI-enforced by `.trellis/scripts/check-doc-breadcrumbs.mjs`.

## Rule 6 — Auto-sync (docs:sync)

`npm run docs:sync` runs: API reference generation, bug index, table snapshots, breadcrumb fix, table ownership check, doc-code accuracy check, strict breadcrumb check. CI runs `npm run docs:check`.

## Rule 7 — Single source of truth

Every concept lives in exactly one place. Other places link to it.

## Rule 8 — Maintenance contract

Every PR that touches a documented surface MUST update the matching doc in the same change-set.

## Rule 9 — Specs vs docs

Specs (`.specify/specs/`) are point-in-time. Docs (`docs/`) are living. After a spec ships, migrate truth into the doc; demote the spec to history.

## Rule 10 — Archive

Move docs to `docs/archive/` when code is deleted or superseded. Never delete — link integrity.

This is a condensed version of the full 12-rule documentation structure pattern.
