# Trellis Masterplan & Verification Checklist

> Version: 1.0.0 | Status: IN PROGRESS | Last updated: 2026-07-03

This is the internal build tracker for Trellis itself. It applies Trellis's own
methodology to its own construction. Every item must be verified before this
project is declared complete.

## How to use this document

- Every item has a status: [DONE], [IN PROGRESS], [PENDING], or [GAP]
- Every script must be EXECUTED and pass, not just written
- Every cross-reference must resolve to a real file
- Gaps are tracked explicitly — nothing is hidden

---

## Build Status Summary

| Component                    | Files | Status      | Verified   |
|------------------------------|-------|-------------|------------|
| Foundation (structure)       | 4     | DONE        | YES        |
| Mandate files                | 2     | GAP         | NO         |
| SDD command sources          | 7/9   | GAP         | NO         |
| SDD command mirrors          | 0/36  | NOT STARTED | NO         |
| Constitution + templates     | 4/5   | GAP         | PARTIAL    |
| Docs structure               | 6/10  | GAP         | PARTIAL    |
| Handoff registry + context   | 2     | DONE        | YES        |
| Scripts (CI + automation)    | 9/9   | DONE        | NO         |
| CLI entry point              | 1     | DONE        | NO         |
| Config files                 | 3/7   | GAP         | NO         |
| CI workflows                 | 0/3   | NOT STARTED | NO         |
| Agent platform configs       | 0/4   | NOT STARTED | NO         |
| Golden test infra            | 0     | NOT STARTED | NO         |
| Phoenix docker-compose       | 0     | NOT STARTED | NO         |
| Packaging (pyproject.toml)   | 0     | NOT STARTED | NO         |

---

## Tier 1 Items (Core SDD + Mandate Sync)

### 1.1 Foundation

- [DONE] Project directory structure created (33 directories)
- [DONE] package.json with all free tools
- [DONE] .gitignore
- [DONE] LICENSE (MIT)
- [DONE] init.sh with tier-aware flag parsing

### 1.2 Mandate Files

- [DONE] AGENTS.md (cross-tool mandate, 4285 chars)
- [GAP] CLAUDE.md — currently a 284-char header stub, NOT synced to AGENTS.md
  - FIX: run check-mandate-sync.mjs --fix after all content is final
- [GAP] docs/README.md — human entry point, referenced everywhere but missing

### 1.3 SDD Pipeline

- [DONE] docs/sdd/sdd.md (flow + policy)
- [GAP] .specify/templates/commands/checklist.md — SDD phase 4.5, referenced in sdd.md
- [GAP] .specify/templates/commands/review.md — SDD phase 6.5, referenced in sdd.md
- [DONE] specify, clarify, plan, tasks, analyze, implement, verify commands (7/9)
- [NOT STARTED] Generated command mirrors (0/36)
  - FIX: run generate-commands.mjs to emit 9 phases x 4 platforms
- [GAP] .specify/templates/checklist-template.md — referenced by checklist phase

### 1.4 Documentation Structure

- [DONE] docs/STRUCTURE.md (10-rule version)
- [DONE] docs/README-FOR-AGENTS.md
- [DONE] docs/coding-standards.md
- [DONE] docs/_subsystem-template.md
- [DONE] docs/bug-fixes/_template.md
- [GAP] docs/README.md — human docs index
- [GAP] docs/ponytail-setup.md — referenced in AGENTS.md and TIERS.md
- [GAP] docs/frontend/README.md — referenced in README-FOR-AGENTS read order

### 1.5 Scripts (Tier 1)

- [DONE] check-mandate-sync.mjs
- [DONE] generate-commands.mjs
- [DONE] check-command-sync.mjs
- [DONE] docs-sync.mjs
- [DONE] check-doc-breadcrumbs.mjs
- [VERIFICATION PENDING] All scripts need execution verification

---

## Tier 2 Items (Code Intelligence + Evals)

### 2.1 Config Files

- [DONE] stryker.config.json (mutation testing)
- [DONE] vitest.config.ts (test + coverage thresholds)
- [DONE] .bounds/root.yaml (boundary enforcement config)
- [GAP] .claude/settings.json — Claude Code hooks (bounds agent-hook)
- [GAP] .env.example — template for environment variables
- [GAP] docker-compose.phoenix.yml — Arize Phoenix self-hosted
- [GAP] pyproject.toml — for pipx CLI install

### 2.2 Scripts (Tier 2)

- [DONE] check-graph-freshness.mjs (Graphify staleness gate)
- [DONE] check-migration-safety.mjs (RLS, FK, version uniqueness)
- [DONE] check-ponytail.mjs (format-only marker validation)
- [DONE] run-evals.mjs (full eval suite runner)

### 2.3 Golden Test Infrastructure

- [NOT STARTED] tests/golden/.gitkeep
- [NOT STARTED] docs explaining golden test pattern

---

## Tier 3 Items (Handoff Loops + Migration Safety + Observability)

### 3.1 Agent Handoff Loops

- [DONE] .agents/handoffs/registry.yaml (8 specialists + phase schedule)
- [DONE] .agents/context/README.md (portable context system)
- [DONE] scripts/handoff-engine.mjs (validate/replay/list)
- [GAP] .codex/hooks.json — Codex PreToolUse hook for implicit triggers

### 3.2 Migration Safety

- [DONE] check-migration-safety.mjs (3 checks: version, RLS, FK)
- [NOT STARTED] Up/down round-trip test (requires test DB connection)
- [NOT STARTED] Data preservation check (requires project-specific snapshots)

---

## Cross-Platform Agent Configs (All Tiers)

### 4.1 Claude Code

- [GAP] .claude/settings.json — hooks (bounds agent-hook, graphify PreToolUse)
- [GAP] .claude/commands/ — generated mirror (0 files)

### 4.2 Codex CLI

- [GAP] .codex/hooks.json — PreToolUse hook
- [GAP] .codex/prompts/ — generated mirror (0 files)

### 4.3 OpenCode

- [GAP] .opencode/command/ — generated mirror (0 files)

### 4.4 GitHub Copilot

- [GAP] .github/copilot-instructions.md
- [GAP] .github/agents/ — generated mirror (0 files)

---

## CI Workflows

- [NOT STARTED] .github/workflows/ci.yml — lint + build + test + docs check
- [NOT STARTED] .github/workflows/bounds.yml — boundary enforcement
- [NOT STARTED] .github/workflows/evals.yml — mutation + golden tests

---

## Packaging & Distribution

- [NOT STARTED] pyproject.toml — CLI entry point for pipx install
- [NOT STARTED] CONTRIBUTING.md — how to extend Trellis
- [GAP] cli.mjs references pipx install in README but no pyproject.toml exists

---

## Edge Cases & Gaps to Address

### E1. CLAUDE.md sync mechanism
The check-mandate-sync.mjs strips the header before comparing. This works but
the header format must match exactly. VERIFIED by running the script.

### E2. Command generation idempotency
generate-commands.mjs overwrites all mirrors. Running it twice produces the
same output. This is correct behavior — the source files are authoritative.

### E3. Missing docs/README.md
docs/README.md is the human entry point, referenced by AGENTS.md, README.md,
and README-FOR-AGENTS.md. It must exist or all breadcrumbs break.

### E4. Graphify integration is documented but not wired
init.sh installs Graphify if --with-graphify is passed, but the PreToolUse hook
( .claude/settings.json, .codex/hooks.json) that makes it "always-on" is not
created. The hook config must be part of the scaffold.

### E5. Bounds integration is documented but not wired
Similar to E4. The bounds agent-hook needs to be in .claude/settings.json.
The init.sh installs Bounds but does not wire the hook.

### E6. Ponytail is advisory but documented as installable
Ponytail plugins are external. Trellis documents the install commands but
cannot guarantee the plugin is installed. The check-ponytail.mjs script works
regardless (it only checks marker format).

### E7. Handoff engine is a reference implementation
The actual handoff loop runs inside the AI agent's native subagent dispatch.
handoff-engine.mjs provides validation and replay but does not execute
handoffs itself. This is documented in the script header but should be clear
in the registry too.

### E8. Migration round-trip test requires a database
check-migration-safety.mjs does static checks (RLS, FK, version). The
up/down round-trip test requires a live database connection. This is noted
in the script but the connection mechanism is not implemented. For a scaffold,
this is acceptable — the project using Trellis provides the DB.

### E9. Coverage thresholds might be too aggressive for greenfield
vitest.config.ts sets 80% coverage thresholds. A new project cloning Trellis
will fail immediately if it has any code without tests. FIX: init.sh should
comment out coverage thresholds initially, with instructions to enable.

### E10. init.sh sed command may fail on some systems
The sed -i syntax differs between macOS (BSD sed) and Linux (GNU sed). init.sh
handles this with a uname check. VERIFIED by reading the script.

---

## Verification Protocol

Before declaring Trellis 1.0.0 complete, run this exact sequence:

1. `cd /Users/farzin/trellis`
2. `node scripts/check-mandate-sync.mjs` — must PASS
3. `node scripts/generate-commands.mjs` — must generate 36 files (9 phases x 4 platforms)
4. `node scripts/check-command-sync.mjs` — must PASS
5. `node scripts/docs-sync.mjs --check` — must PASS (no broken links)
6. `node scripts/check-migration-safety.mjs` — must PASS (or SKIP if no migrations)
7. `node scripts/check-ponytail.mjs` — must PASS (advisory)
8. `node scripts/handoff-engine.mjs validate` — must PASS
9. `node scripts/handoff-engine.mjs list` — must list 8 specialists
10. Verify all cross-references in AGENTS.md, README.md, TIERS.md resolve to real files

If any step fails, the gap must be fixed before proceeding.

---

## Post-Build Checklist (for the reviewer)

When someone reviews this build, verify:

- [ ] Clone the repo, run init.sh, get a working project
- [ ] All 4 platforms (Claude, Codex, OpenCode, Copilot) can read their mandate
- [ ] Slash commands work after generation
- [ ] CI workflows pass on a clean checkout
- [ ] TIERS.md accurately describes what each tier provides
- [ ] No referenced file is missing (grep all paths in all .md files)
- [ ] Ponytail integration is advisory, not blocking
- [ ] Handoff registry validates cleanly
- [ ] Eval suite runs (even if some steps SKIP due to no code yet)
