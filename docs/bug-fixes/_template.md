# Bug Fix

<!--
Required frontmatter. Copy this template for every production-affecting fix.
File name: docs/bug-fixes/YYYY-MM-DD-<slug>.md
-->

> Parent: [`docs/bug-fixes/README.md`](README.md)
---
id: BUG-NNN
title: <one-line title>
date_fixed: YYYY-MM-DD
severity: low | medium | high | critical
status: fixed | monitoring
area: <domain>
subsystem: <subsystem>        # only when area is a complex domain
category: state-machine | data-integrity | webhook | env-config | route-404 | concurrency | money | rls-security | email | ui-display | a11y | docs-drift | regression | other
files:
  - path/to/file.ts
fixed_by: <name or agent>
---

## Summary

One paragraph: what was wrong, what the impact was.

## Root cause

What caused the bug. Be specific — cite file:line and the exact logic flaw.

## Fix

What was changed and why this approach.

## Prevention

What guard, test, or doc prevents this from recurring.

## References

- Spec: NNN (if applicable)
- Related bugs: BUG-NNN
