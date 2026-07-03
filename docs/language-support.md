# Language & Tool Support Matrix

> Parent: `docs/README.md`

Trellis is stack-agnostic, but the third-party tools it integrates have
varying language coverage. This document is the honest map of what works
where, and what fallback to use when a tool does not support your language.

---

## The Core Truth

Trellis's FRAMEWORK features work for ANY language:
- SDD pipeline (specify → verify)
- Mandate files (AGENTS.md, CLAUDE.md)
- Handoff loops and specialist registry
- Documentation structure and doc-code accuracy
- Ponytail integration
- Portable context system
- Evolution engine
- CI checks that are language-agnostic (mandate sync, command sync, doc sync, agnostic check, breadcrumb check)

Trellis's TOOL INTEGRATIONS have language gaps:
- Some tools are JS/TS-only (Fallow, StrykerJS)
- Some support multiple languages but with different feature depth (Graphify)
- Some need language-specific adapters (Bounds, migration tools)

When a tool does not support your language, Trellis has a fallback. This
document is the reference.

---

## Tool Language Support

### Code Knowledge Graph

| Tool | JS/TS | Python | Go | Rust | Java | Ruby | PHP | Fallback |
|------|-------|--------|----|------|------|------|-----|----------|
| **Graphify** | 36 grammars | Yes | Yes | Yes | Yes | Yes | Yes | N/A — broadest coverage |
| **Bounds** | Yes (tree-sitter) | Partial | Planned | Planned | No | No | No | dependency-cruiser for JS; manual review for others |
| **Fallow** | Yes | No | No | No | No | No | No | See language-specific alternatives below |

### Dead Code / Duplication / Complexity

| Language | Primary Tool | Fallback | Status |
|----------|-------------|----------|--------|
| JS/TS | Fallow (free) | Knip, ts-unused-exports | Fully supported |
| Python | pyflakes + vulture | radon (complexity), bandit (security) | Manual wiring needed |
| Go | deadcode (built-in) + staticcheck | golangci-lint (includes deadcode detection) | Use golangci-lint |
| Rust | cargo udeps (unused deps) + clippy (lint/complexity) | cargo-deny | Built into cargo ecosystem |
| Java | SpotBugs / PMD | SonarQube (free CE) | Manual wiring needed |
| Ruby | RuboCop (includes dead code) | Brakeman (security) | Use RuboCop |
| PHP | PHPStan / Psalm | Laravel Pint | Use PHPStan |

### Mutation Testing

| Language | Tool | License | Fallback |
|----------|------|---------|----------|
| JS/TS | StrykerJS | Apache-2.0 | N/A (only option) |
| Python | mutmut | MIT | cosmic-ray (MIT) |
| Go | go-mutesting | MIT | Manual test review |
| Rust | cargo-mutants | MIT | mutargo (experimental) |
| Java | PIT (pitest) | Apache-2.0 | N/A |
| Ruby | Mutant | MIT | N/A |
| C/C++ | Mull | LGPL | N/A |
| PHP | Infection | BSD | N/A |

### Property-Based Testing

| Language | Tool | License |
|----------|------|---------|
| JS/TS | fast-check | MIT |
| Python | Hypothesis | MPL-2.0 |
| Go | gopter / rapid (stdlib) | MIT / stdlib |
| Rust | proptest / quickcheck | MIT / MIT |
| Java | jqwik | GPL |
| Ruby | Rantly | MIT |
| PHP | Eris | MIT |

### Migration Safety

Trellis supports 15 migration tools via the adapter system. See
`scripts/migration-adapters.json` and run:
```bash
node scripts/check-migration-safety.mjs --list-adapters
```

### Boundary Enforcement

| Language | Bounds | Alternative |
|----------|--------|-------------|
| JS/TS | Yes | dependency-cruiser (file-level import rules) |
| Python | Planned | import-linter (enforce layer boundaries) |
| Go | Planned | Boundary check via package imports analysis |
| Rust | Planned | modularity lint or manual crate boundaries |
| Java | No | ArchUnit (architecture tests) |
| Other | No | Language-specific dependency analysis |

### Linting / Formatting

| Language | Fast Tool | Standard |
|----------|-----------|----------|
| JS/TS | Biome / Oxlint (Apache-2.0) | ESLint + Prettier |
| Python | Ruff (MIT, 100x faster than flake8) | flake8 + black |
| Go | golangci-lint | gofmt + go vet |
| Rust | clippy | rustfmt |
| Java | SpotBugs | Checkstyle / PMD |

---

## Fallback Strategy Per Language

### JavaScript / TypeScript

All Trellis tools work natively. No fallbacks needed. This is the primary
supported stack. Templates in `templates/js-ts/`.

### Python

| Feature | Tool | Status |
|---------|------|--------|
| SDD pipeline | Language-agnostic | Works |
| Mandate files | Language-agnostic | Works |
| Handoffs | Language-agnostic | Works |
| Docs | Language-agnostic | Works |
| Migration safety | Alembic, Django, SQLAlchemy adapters | Works |
| Knowledge graph | Graphify (Python grammar) | Works |
| Boundary enforcement | Bounds (partial) → import-linter (fallback) | Fallback |
| Dead code | vulture / pyflakes | Manual wiring |
| Mutation testing | mutmut (template in templates/python/) | Works |
| Property testing | Hypothesis | Works |
| Linting | Ruff (recommended) | Works |
| Coverage | pytest-cov | Works (template in templates/python/) |

Python is fully functional with two fallbacks: boundary enforcement (use
import-linter) and dead-code analysis (use vulture). Both are documented in
the eval runner and the Python template README.

### Go

| Feature | Tool | Status |
|---------|------|--------|
| SDD pipeline | Language-agnostic | Works |
| Mandate files | Language-agnostic | Works |
| Handoffs | Language-agnostic | Works |
| Docs | Language-agnostic | Works |
| Migration safety | golang-migrate, Goose, Atlas adapters | Works |
| Knowledge graph | Graphify (Go grammar) | Works |
| Boundary enforcement | Bounds (planned) → package import analysis | Fallback |
| Dead code | deadcode (built-in) + golangci-lint | Works |
| Mutation testing | go-mutesting | Works (documented in templates/go/) |
| Property testing | gopter / testing/quick | Works |
| Linting | golangci-lint | Works |
| Coverage | go test -cover | Works |

Go is fully functional. Boundary enforcement falls back to package import
analysis until Bounds adds Go support.

### Rust

| Feature | Tool | Status |
|---------|------|--------|
| SDD pipeline | Language-agnostic | Works |
| Mandate files | Language-agnostic | Works |
| Handoffs | Language-agnostic | Works |
| Docs | Language-agnostic | Works |
| Migration safety | sqlx, refinery, or Diesel adapters (add to migration-adapters.json) | Add adapter |
| Knowledge graph | Graphify (Rust grammar) | Works |
| Boundary enforcement | Bounds (planned) → crate boundaries | Fallback |
| Dead code | cargo udeps + clippy | Works |
| Mutation testing | cargo-mutants | Works (documented in templates/rust/) |
| Property testing | proptest / quickcheck | Works |
| Linting | clippy | Works |
| Coverage | cargo-tarpaulin | Works |

Rust is fully functional. Migration safety needs a Rust adapter added to
`scripts/migration-adapters.json` (sqlx-macros, refinery, or Diesel).

### Java

| Feature | Tool | Status |
|---------|------|--------|
| SDD pipeline | Language-agnostic | Works |
| Migration safety | Flyway, Liquibase adapters | Works |
| Knowledge graph | Graphify (Java grammar) | Works |
| Boundary enforcement | ArchUnit (fallback) | Fallback |
| Dead code | SpotBugs / PMD | Manual wiring |
| Mutation testing | PIT (pitest) | Manual wiring |
| Property testing | jqwik | Manual wiring |
| Linting | Checkstyle / PMD | Works |

Java is functional via templates-not-yet-created. The SDD pipeline and
migration safety work. Evals need manual wiring.

### Other Languages (Ruby, PHP, C/C++, Swift, Kotlin, Scala, etc.)

SDD pipeline, mandate files, handoffs, and docs work (language-agnostic).
Migration safety works if the tool is in the adapter list. Knowledge graph
works via Graphify. Evals and boundary enforcement need language-specific
tools documented and wired by the adopting project.

---

## How Fallbacks Work in Practice

When a tool does not support your language, Trellis does three things:

### 1. Graceful Skip

The eval runner and CI checks detect the gap and report it clearly:

```
── Boundary enforcement (Bounds) ──
SKIP: Bounds does not support Python
      Fallback: use import-linter (pip install import-linter)
      Trellis will enforce boundaries manually via code review until
      import-linter is wired into CI.
```

### 2. Documented Alternative

Each fallback is documented in this file and in the per-stack template README.
The adopting project knows exactly what to install and how to wire it.

### 3. No Silent Failure

Trellis never silently skips a check without telling you. Every skip produces
a message explaining what was skipped, why, and what to do about it.

---

## Adding Language Support

To add support for a new language:

1. **Migration adapter**: Add an entry to `scripts/migration-adapters.json`
   if the language has a common migration tool.
2. **Eval template**: Create `templates/<lang>/` with test runner config,
   mutation testing config, and property testing setup.
3. **Boundary enforcement**: If Bounds supports it, wire it. If not, document
   the fallback in this file.
4. **Linting**: Document the recommended linter in this file.
5. **CI**: Update `scripts/adapt-to-project.mjs` to detect the language and
   set the appropriate script commands.
6. **Test**: Clone Trellis with a project in that language, run init.sh,
   verify all checks either pass or skip with a clear message.

---

## The Honest Summary

| Dimension | Coverage |
|-----------|----------|
| SDD pipeline | 100% language-agnostic |
| Mandate + handoffs + docs | 100% language-agnostic |
| Migration safety | 15 tools, covers most stacks |
| Knowledge graph (Graphify) | 36 tree-sitter grammars |
| Mutation testing | JS/TS, Python, Go, Rust, Java, Ruby, PHP, C/C++ — all have free tools |
| Property testing | All major languages have free tools |
| Boundary enforcement (Bounds) | JS/TS full; Python/Go/Rust planned with fallbacks |
| Dead code (Fallow) | JS/TS only; every other language has its own free tool |
| Linting | All languages have free, fast linters |

Trellis works for any language. Some tools need fallbacks. Every fallback is
documented here, in the eval runner output, and in per-stack templates. No
silent gaps.
