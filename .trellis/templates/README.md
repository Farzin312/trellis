# Trellis Templates

Per-stack configuration templates. Copied to the project root by init.sh
based on detected stack.

```
templates/
├── js-ts/
│   ├── vitest.config.ts       — Vitest config (test runner + coverage)
│   ├── stryker.config.json    — StrykerJS config (mutation testing)
│   └── README.md              — what gets copied + alternatives
├── python/
│   ├── pytest.ini             — pytest config (test runner + coverage)
│   ├── mutmut.ini             — mutmut config (mutation testing)
│   └── README.md
├── go/
│   └── README.md              — testing built-in; mutation via go-mutesting
├── rust/
│   └── README.md              — cargo test built-in; mutation via mutargo
└── README.md                  — this file (how the template system works)
```

## How It Works

During `init.sh`, the stack is detected (package.json, requirements.txt,
go.mod, Cargo.toml). The matching template directory is copied to the project
root. Templates NOT matching the detected stack stay in templates/ (gitignored
from the root perspective — they are framework assets, not project config).

If no stack is detected, no config files are copied. The project brings its own.

## Adding a Stack

1. Create `templates/<stack-name>/` with the config files.
2. Add detection logic to `.trellis/scripts/adapt-to-project.mjs`.
3. Document the eval equivalents (test runner, mutation testing, property testing).
4. Update `docs/credits.md` if new tools are referenced.

## Eval Equivalents by Stack

| Capability | JS/TS | Python | Go | Rust |
|-----------|-------|--------|----|------|
| Test runner | Vitest | pytest | go test | cargo test |
| Coverage | c8 / v8 | pytest-cov | go test -cover | cargo-tarpaulin |
| Mutation testing | StrykerJS | mutmut / cosmic-ray | go-mutesting | mutargo / cargo-mutants |
| Property testing | fast-check | Hypothesis | gopter / rapid | proptest / quickcheck |

Trellis's run-evals.mjs calls the JS/TS tools by default. For other stacks,
the project wires its own eval command into package.json scripts or Makefile.
