# Contributing to Trellis

> Parent: [documentation index](./README.md)

Contributions should preserve the dependency-free core, conservative claims,
and explicit boundary between Trellis and adopting-project responsibilities.

## Workflow

1. Create or update an SDD chain for non-trivial behavior.
2. Add a failing standard-library test for the intended contract.
3. Implement the smallest sufficient change.
4. Update CLI help, package metadata, skills, and living docs together.
5. Run `npm run check` and record any optional skips or external proof honestly.
6. Submit a focused pull request explaining the problem, trade-off, and evidence.

Stack adapters need fixtures for valid, invalid, mixed, absent-toolchain, and
failing-toolchain cases. Optional integrations need explicit configuration,
readiness checks, actionable failures, and accurate license documentation.

Changes that silently rewrite user-owned files, hide failures, add unjustified
core dependencies, or claim untested compatibility are not acceptable.
