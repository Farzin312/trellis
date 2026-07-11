# Documentation structure

This file defines ownership and navigation for repository documentation.

## Audiences

- `README.md` is the adopter journey: value, prerequisites, installation, first
  success, troubleshooting, license, and contribution entry point.
- `docs/README.md` routes adopters, maintainers, generated guidance, and history.
- `docs/README-FOR-AGENTS.md` is the token-efficient agent routing page.
- Project architecture belongs in `docs/DESIGN.md` or `docs/SYSTEM.md` only when
  the project has verified content to put there; do not generate empty claims.
- `docs/systems/` contains living subsystem documentation.
- `.specify/specs/` and `docs/bug-fixes/` contain historical delivery evidence.

## Breadcrumbs and links

Every Markdown file below `docs/` has one `> Parent:` breadcrumb, except this
file and `docs/README.md`. Link to a routing parent rather than an unrelated
reference bank. All local links must resolve; `npm run docs:check` enforces both
rules without rewriting files.

## Truth and duplication

Keep one authoritative explanation per concept and link to it elsewhere. Living
docs describe current behavior. Specifications and bug-fix entries preserve
what was decided at a point in time and never override living docs.

Generated content must name its generator and canonical source. Currently only
`.claude/skills/` is a generated documentation-like surface; its source is
`.agents/skills/`.

When code, paths, commands, or support labels change, update the owning living
document and its inbound references in the same change.
