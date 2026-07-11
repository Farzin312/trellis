# Language Support

> Parent: [documentation index](./README.md)

Trellis separates tested automation from guidance that requires project-owned
wiring. A language having a third-party test or analysis tool does not mean
Trellis installs or configures that tool.

For every stack, the preferred integration is a package script named
`check:project`. It is the project-owned aggregate for build, lint, type, test,
migration, browser, and integration evidence. When present, Trellis runs it once
and suppresses automatic language test adapters to avoid duplicate work.

## Tested automation

Repository fixtures cover manifest detection and mixed-stack reporting for:

| Stack value | Detected evidence | Project test behavior |
|---|---|---|
| `generic` | No recognized manifest or an explicit value | Core Trellis checks only |
| `javascript` / `typescript` | `package.json` and TypeScript metadata | Runs `check:project`, or the legacy `test:project` fallback, without recursion into Trellis's wrapper |
| `python` | `pyproject.toml` or `requirements.txt` | Runs the configured Python test command when its toolchain is present |
| `go` | `go.mod` | Runs the configured Go test command when its toolchain is present |
| `rust` | `Cargo.toml` | Runs the configured Cargo test command when its toolchain is present |

Auto-detection reports every detected stack; it does not discard a mixed
project after finding the first manifest. Explicit `--stack` values are
validated against the supported vocabulary.

Without `check:project`, the Python, Go, and Rust rows are fallback discovery,
not a substitute for a complete project gate.

The core Agent Skills, SDD artifacts, mandate, documentation checks, and Node
self-tests do not depend on an adopting project's language.

`trellis map` is also language-neutral: it reports manifests, file composition,
tests, and documented systems without parsing imports. Deeper language coverage
belongs to the optional tools described in
[repository mapping](./repository-mapping.md).

## Manual integration

Java, Ruby, PHP, C/C++, Swift, Kotlin, Scala, and other stacks can keep the
language-neutral Trellis guidance, but their project test, lint, mutation,
coverage, migration, and boundary commands are project-owned until a tested
adapter is added. Label these setups as manual; do not present a suggested
third-party tool as configured evidence.

To add tested automation:

1. Add strict manifest detection and a validated stack value.
2. Add standard-library fixtures for no toolchain, working toolchain, and failing
   toolchain behavior.
3. Preserve mixed-stack detection.
4. Report missing configured tools with a concrete install or configuration
   action.
5. Update this matrix only after those checks pass.

## Optional integration coverage

- Graphify language coverage belongs to Graphify and may change independently.
- Bounds readiness is based on project configuration and owned-file evidence,
  not merely the presence of a command on `PATH`.
- Migration safety runs only for an unambiguously detected supported adapter.

Run `trellis check --ai` to see what executed, failed, warned, or skipped in the
current project.
