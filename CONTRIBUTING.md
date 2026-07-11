# Contributing to Trellis

Contributions should preserve the dependency-free core, conservative claims,
and explicit boundary between Trellis and adopting-project responsibilities.

## Development setup

```bash
git clone https://github.com/Farzin312/trellis.git
cd trellis
npm ci --ignore-scripts
npm run check
```

Node.js 22 or a newer supported release, npm, Git, and Bash are required. Core
development uses no third-party runtime or development package dependency.

## Workflow

1. Create or update an SDD chain for non-trivial behavior.
2. Add a failing standard-library test for the intended contract.
3. Implement the smallest sufficient change.
4. Update CLI help, package metadata, skills, and living docs together.
5. Run `npm run check` and record optional skips or external proof honestly.
6. Submit a focused pull request explaining the problem, trade-off, and evidence.

Stack adapters need fixtures for valid, invalid, mixed, absent-toolchain, and
failing-toolchain cases. Optional integrations need explicit configuration,
readiness checks, actionable failures, and accurate license documentation.
Changes to the pinned Phoenix compose payload must update its reviewed SHA-256
contract, documentation, and service tests together.

Changes that silently rewrite user-owned files, hide failures, add unjustified
core dependencies, or claim untested compatibility are not acceptable. Read
the [agent mandate](AGENTS.md), [documentation rules](docs/STRUCTURE.md), and
[SDD contract](docs/sdd/sdd.md) before starting non-trivial work.
