# Security Checklist: Product Readiness and Truthful Positioning

> Spec: 001

- [x] Every user-controlled CLI argument has validation and an argument-array execution contract.
- [x] Scaffold targets and temporary directories have explicit ownership and collision behavior.
- [x] The payload is allowlisted and excludes `.env*`, active specs, metrics, caches, Git history, and unknown live-worktree files.
- [x] Initialization preserves user configs, hooks, mandates, package files, and unrelated generated-path files.
- [x] Optional network installations are explicit, version-constrained, and excluded from the offline core.
- [x] No secret is required, read, printed, copied, or persisted by the core.
- [x] Corrupt external metadata cannot reach shell evaluation.
- [x] Unknown services, stacks, integrations, commands, and flags fail closed.
- [x] The generated policy does not claim application auth is configured.
- [x] No money-handling surface is introduced.

Result: PASS
