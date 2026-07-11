---
id: BUG-001
title: P0 install blockers — CLI/init.sh could not install or scaffold correctly
date_fixed: 2026-07-08
severity: critical
status: fixed
area: cli
subsystem: bootstrap
category: env-config
files:
  - cli.mjs
  - init.sh
  - package.json
  - pyproject.toml
fixed_by: Claude (Trellis P0 install fix work)
---

# Bug Fix

> Parent: [`docs/bug-fixes/README.md`](README.md)

## Summary

The `trellis` scaffold did not install or scaffold as advertised. There was no
installable `trellis` binary, `trellis new` copied the repo's **parent** directory,
the copy filter excluded the wrong paths, `pyproject.toml` had an invalid build
backend, `--agents` (space form) and `--tier` were silently ignored.

## Root cause

- `cli.mjs:25` — `templateRoot = join(__dirname, '..')` resolved to the repo's
  parent (`/Users/farzin`), so every subcommand ran in the wrong dir and
  `trellis new` `cpSync`'d the parent tree.
- `package.json` had **no `"bin"`**, so `npm install -g .` created no command.
- `pyproject.toml` declared a Python entry point (`trellis.cli:main`) and package
  that don't exist, plus an invalid build backend
  (`setuptools.backends._legacy:_Backend`) — `pipx install` always failed.
- `cli.mjs:60-63` — cpSync filter compared `src.split('/').pop()` (basename), so
  `.bounds/cache.db` was never excluded while any nested `.next` was wrongly excluded.
- `init.sh:22` — `--agents) shift_for_agents=true` set an unused var and never
  captured the next arg; only `--agents=x` worked.
- `--tier` was read by `cli.mjs` but never written; `init.sh` hardcoded
  `"active_tier": 2`. A trailing/invalid `--tier` produced `undefined`.

## Fix

- `templateRoot = __dirname`.
- Added `"bin": { "trellis": "./cli.mjs" }` and `"engines": { "node": ">=18" }`
  to `package.json`; `chmod +x cli.mjs`. Node is the single install path.
- Deleted `pyproject.toml` (dropped the broken Python packaging path).
- cpSync filter now matches paths **relative to** `templateRoot`.
- Dropped the `--agents` space form (only `--agents=x` supported, documented).
- `--tier` is validated (1/2/3, default 2) in `cli.mjs` and threaded via
  `--tier=N` into `init.sh`, which writes `active_tier` and treats tier 1 as
  core-only (no optional tools).

## Prevention

`node --check cli.mjs` + `bash -n init.sh` catch syntax regressions; the copy
filter and tier parsing were verified with isolated smoke tests. The single Node
install path removes the dual-packaging drift that caused the pyproject failure.

## References

- Spec: Trellis P0 install fix work (original WORKPLAN §1, now completed and deleted)
- Related bugs: none
