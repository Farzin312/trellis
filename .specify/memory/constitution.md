# __PROJECT_NAME__ Constitution

> Version: 1.0.0. The canonical source for constitutional invariants. Operational mechanics live in `docs/STRUCTURE.md`; this file states the non-negotiables.

## Core Principles

### I. Code Is Source of Truth

When a doc and the code disagree, the doc is updated to match the code — unless the code itself is contradicting (types lying about runtime, dead branches, mutually exclusive constraints). In that case, stop and surface the code concern.

### II. Auth, Security & Money Fail-Closed

- Auth truth is your auth provider (e.g., Supabase Auth). No alternative auth source.
- Payment truth is your payment provider's webhooks (e.g., Stripe). Clients MUST NOT claim payment status directly.
- Row-Level Security (RLS) MUST be enabled on every public table.
- Money and audit tables are backend-only; no client writes.
- Server-side validation is mandatory; never trust client input.
- Auth, role, and status checks MUST fail closed (deny by default).

### III. API Route Discipline

Every API route follows: Authentication -> Status check -> Role check -> Rate limiting -> Input validation -> Database operation -> Audit log -> Response. Skipping or reordering is not permitted.

### IV. Documentation Contract

- Single owner per topic. Other docs link to it.
- Subsystem folder pattern: `docs/systems/<area>/<subsystem>.md` or `/README.md`.
- Breadcrumbs (`> Parent:` / `> Children:`) point at real files. CI-enforced.
- `docs:sync` gate: every commit touching code or docs runs the sync pipeline.
- Doc-drift detection on every read: cross-check load-bearing claims against code.
- Bug-fix doc contract: every production bug fix gets a categorized entry.
- Work-not-done rule: a code change without the doc update is incomplete work.

### V. Large File Decomposition

File growth is a design problem, not a cleanup task. 400+ lines: design warning. 500-600: extraction plan required. 800+: decompose immediately. `shared.ts` files stay small (constants, types, mappers, re-exports).

### VI. Conservative Phases

Delay complexity until proven needed. Forward migrations only; never rewrite phase goals. Each phase inherits all prior invariants.

### VII. Observability & Audit

All API handlers use request-level observability. Structured logging via the logger module; raw `console.*` is not permitted in production paths. Sensitive operations (role changes, refunds, state transitions) are audit-logged with actor, before/after state, and request id.

### VIII. Reusability & Deterministic Clarification

- Types centralized in `types/`. No inline reuse-candidate types.
- Reuse established auth and DB primitives. No one-off patterns.
- DRY: extract early when duplication surfaces.
- Environment variables read through centralized helpers. Direct `process.env.X` only inside the env module.
- No arbitrary cap on clarification questions in SDD.

### IX. TDD & SDD Discipline

- Every implementation task has a paired `[TEST]` task. Tests first, run to failure, then pass.
- SDD phase ordering: Specify -> Clarify -> Plan -> Tasks -> Analyze -> Implement -> Verify. No skipping forward.
- **Trivial change escape hatch**: single-file fixes (<3 lines), config changes, dependency bumps, typo fixes, and comment additions may skip the full SDD pipeline. Fix, lint, commit. If the change touches auth, money, security, or more than one file, it is non-trivial and requires full SDD.
- No silent re-planning during Implement. If ambiguity surfaces, return to an earlier phase.
- ID-only cross-references across artifacts (FR-XXX, SC-XXX, BUG-NNN).
- Pre-PR gates: `npm run lint` exits 0. `npm run build` succeeds. `npm run docs:check` passes.

### X. Environment Isolation & Fail-Fast

- `.env.local` is the single source of truth for environment variables.
- Configuration errors throw at boot with self-diagnosing messages. Silent degradation and generic 500s are forbidden.
- Runtime errors surface a concrete cause and next step. Raw provider error strings and "Something went wrong" are not acceptable.

### XI. Frontend Performance & Accessibility Floor

- LCP element chosen on purpose. One `priority` image per route.
- Static asset budgets enforced. Third-party scripts do not load on first paint.
- Single `<main>` per page. Skip link targets it.
- Color contrast >= 4.5:1 normal text, >= 3:1 large text.
- Accessible names include visible text. Descriptive link text required.
- Tradeoff registry: knowing violations of the floor MUST be documented.

## Ponytail Addendum

Ponytail (lazy senior dev mode) is a DEFAULT POSTURE, not a constitutional principle. Start lazy: stdlib first, one line over fifty, no unrequested abstractions. But the lazy solution is not always correct. When you deliberately go beyond lazy, mark it: `# trellis: full-impl, <reason>`. When you simplify, mark it: `# ponytail: <ceiling>, upgrade: <path>`. Neither marker is a build gate — they are signals for reviewers.
