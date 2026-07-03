# Subsystem Doc Template

> Parent: `docs/README.md`

Copy this template when creating a new subsystem doc at `docs/systems/<domain>/<subsystem>.md`.

---

# <Subsystem Name>

> Parent: [`docs/systems/<domain>/README.md`](../README.md)

## 1. What this subsystem owns
Disambiguate from sibling subsystems. One paragraph.

## 2. File:function map
| File | Function | Purpose |
|------|----------|---------|

## 3. API routes
Cross-link to auto-generated `docs/api-reference/`.

## 4. Database (owned tables)
Single owner per table. Cross-link to `docs/database/tables/<name>.md`.

## 5. State machine / invariants
The "must always be true" knowledge.

## 6. Failure modes
Contract for how it fails.

## 7. Logs / Observability
Every structured log event emitted.

## 8. Tests
Test files that verify this subsystem.

## 9. Edge cases handled
Subtle production bites + where guarded.

## 10. Security
Auth/role/RLS/rate-limit/audit/PII per subsystem.

## 11. UX / Usability
Loading/empty/error states, mobile, dark mode, a11y.

## 12. SDD spec history
Chronological evolution.

## 13. Past bugs (auto)
Injected by `scripts/generate-bug-index.mjs`.

## 14. See also
Explicit doc-graph edges.
