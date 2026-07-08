# Bug Fix

> Parent: [`docs/bug-fixes/README.md`](README.md)
---
id: BUG-002
title: Advertised features that never fired + unpinned/silent dependencies
date_fixed: 2026-07-08
severity: high
status: fixed
area: cli
subsystem: bootstrap
category: env-config
files:
  - cli.mjs
  - init.sh
  - README.md
  - docker-compose.mem0.yml
  - .trellis/services/docker-compose.phoenix.yml
fixed_by: Claude (Trellis truthfulness + dependency fix work)
---

## Summary

The README/CLI advertised behavior the code never performed: stack auto-adaptation
never ran, `trellis evolve` did not exist, `trellis spec` over-claimed, the project
structure counts were stale. Dependencies were unpinned and `npm install` errors
were swallowed, with no up-front prerequisite checks and a `DONE` banner that lied
when steps were skipped.

## Root cause

- `init.sh` never called `adapt-to-project.mjs`, so the "detects your stack and
  adapts the constitution" claim was false.
- `cli.mjs` had no `evolve` case though the README documented `trellis evolve`.
- `trellis spec` printed a misleading line implying it started something.
- README structure block was stale: `pyproject.toml`, "11 scripts" (18), "10
  specialists" (7 SDD-phase entries), and a broken tree row for `.trellis/tests/golden/`.
- `graphifyy` / `bounds` / Docker images were unpinned; `npm install --silent
  2>/dev/null` hid the real failure reason; no version preflight; the final banner
  always said "DONE — ready".

## Fix

- init.sh now calls `adapt-to-project.mjs` (auto-detect, or `--stack=` from the
  wizard). `trellis evolve [--all]` added (shells to `adapt-to-project.mjs`; `--all`
  also runs skill-health). `trellis spec` reworded as advisory.
- README structure/counts corrected; `evolve` reference made accurate.
- Pinned `graphifyy==0.9.10`, `bounds@1b5320c5…`, `qdrant/qdrant:v1.18.2`,
  `arizephoenix/phoenix:17.20.0` (versions hoisted to variables in init.sh).
- Dropped `2>/dev/null` on `npm install`; added a Node>=18 / Python>=3.10 / uv·pipx
  preflight; added a `SKIPPED[]` tracker so the final banner reports what was
  skipped and why.
- Fixed the mem0 dashboard port comment (`3000` → `8228`).

## Prevention

`npm run lint` + `docs:check` stay green; init.sh was smoke-tested end-to-end in a
throwaway repo copy. Pinned versions live in single `init.sh` variables so bumps are
one-line and auditable.

## References

- Spec: Trellis truthfulness + dependency fix work (original WORKPLAN §3 + §4, now completed and deleted)
- Related bugs: BUG-001
- Known blocker surfaced: `mem0ai/mem0:latest` is a Docker Hub 404 (image does not
  exist) — pinning is moot until the correct image/build source is decided.
