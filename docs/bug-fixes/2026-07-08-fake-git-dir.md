---
id: BUG-003
title: init.sh fabricated a fake .git/hooks in projects with no git repo
date_fixed: 2026-07-08
severity: low
status: fixed
area: cli
subsystem: bootstrap
category: env-config
files:
  - init.sh
fixed_by: Claude (curated-download work)
---

# Bug Fix

> Parent: [`docs/bug-fixes/README.md`](README.md)

## Summary

Running `init.sh` (including via `trellis new`) in a directory that was not yet a
git repository created a bogus `.git/hooks/` directory. The result was a `.git`
folder that is not a valid repository, polluting an otherwise clean scaffold and
confusing later `git init`.

## Root cause

Step 8 ran `mkdir -p .git/hooks` unconditionally, then wrote a `pre-commit` hook —
regardless of whether `.git` was a real repository.

## Fix

Guard the step with `git rev-parse --git-dir`. Only install the hook inside a real
repo, resolving the hooks path via `git rev-parse --git-path hooks` (respects
worktrees / custom `core.hooksPath`). Otherwise print an INFO line telling the user
to `git init` and re-run.

## Prevention

Verified both paths: `trellis new` (no repo) leaves no `.git`; `init.sh` inside a
real repo installs the executable `pre-commit` hook.

## References

- Related bugs: BUG-001, BUG-002
