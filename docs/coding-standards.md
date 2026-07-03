# Coding Standards

> Parent: `docs/STRUCTURE.md`

The single source of truth for what "good code" means. Every AI tool and developer applies this.

## 1. Guard Clauses & Early Returns

Guard clauses eliminate nested conditionals. The happy path is visually dominant.

## 2. Composition Over Inheritance

Prefer composing small, focused functions/objects over inheritance hierarchies.

## 3. Error Handling

Structured error handling with custom error classes. Never swallow errors silently.

## 4. TypeScript Discipline

No `any`. Use proper types. Centralize domain types in `types/`.

## 5. Naming

Descriptive, consistent naming. No abbreviations except widely-known ones.

## 6. Module Organization

Domain folders in `lib/`. Small focused files (see Large File Decomposition).

## 7. State Machines

Explicit state machines for multi-step flows. Dual-column invariants where applicable (e.g., status + capture_state).

## 8. Custom Error Classes

Domain-specific error classes that carry context.

## 9. Idempotency

Operations that can be retried MUST be idempotent. Use idempotency keys for payments.

## 10. Race Condition Prevention

Database-level locks, atomic operations, or PostgREST `check` clauses.

## 11. Isomorphic Helpers

Pure logic that runs on both server and client lives in isomorphic helpers.

## 12. Props & Component Patterns

Server Components by default. Client components only when hooks/events are needed.

## Ponytail Addendum

Start with the lazy solution (stdlib first, one line over fifty). But verify it is correct on edge cases. Lazy means writing less code, not picking the flimsier algorithm. When you go beyond lazy, mark with `# trellis: full-impl, <reason>`.
