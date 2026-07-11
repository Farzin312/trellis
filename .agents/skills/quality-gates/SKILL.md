---
name: quality-gates
description: Perform empirical pre-merge or release verification and report evidence without turning missing checks into passes. Use during SDD Verify, before merge, or before claiming a change complete.
---

# Quality gates

1. Read the repository's documented aggregate gate and configured manifests.
2. Run the aggregate gate (`npm run check` in Trellis projects).
3. Run additional build, type, lint, migration, browser, integration, or mutation
   commands only when the project actually configures them and the change needs
   that evidence.
4. Compare relevant test scope or baseline only when a versioned baseline exists;
   never invent a prior count or threshold.
5. Verify generated artifacts are reproducible and the working tree contains no
   unexpected generator drift.
6. Continue independent safe checks after a failure so the report is complete.
7. Record command, exit status, relevant output, and environment limitation.

Classify results:

- `PASS`: the named check ran and met its contract.
- `FAIL`: required or configured evidence failed.
- `WARN`: evidence ran but has a non-blocking concern.
- `SKIP`: optional evidence was not configured or could not run; never a pass.

Return a compact table and an overall `READY`, `NOT READY`, or `PARTIAL` verdict.
External production proof, owner approval, and unavailable services remain open
even when local commands pass.
