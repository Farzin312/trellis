# Trellis Evaluation System

> Parent: `docs/README.md`

This guide explains every eval in Trellis, when it runs, what it catches, and
how to use it. Evals are the quality backbone — they prove code actually works,
not just that it executes.

---

## The Eval Stack at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│                    TRELLIS EVAL SYSTEM                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: CODE QUALITY                                       │
│  ├── StrykerJS (mutation testing) — do tests catch bugs?    │
│  └── fast-check (property testing) — do edge cases break?   │
│                                                              │
│  Level 2: REGRESSION PREVENTION                             │
│  └── Golden tests (per-spec locked suites)                  │
│                                                              │
│  Level 3: AGENT QUALITY                                      │
│  └── Arize Phoenix (self-hosted observability)              │
│                                                              │
│  Level 4: FRAMEWORK HEALTH                                   │
│  ├── check-agnostic.mjs (stack-agnostic enforcement)        │
│  ├── check-mandate-sync.mjs (mandate file integrity)        │
│  ├── check-command-sync.mjs (command mirror integrity)      │
│  ├── check-graph-freshness.mjs (knowledge graph freshness)  │
│  ├── check-migration-safety.mjs (database migration evals)  │
│  └── check-ponytail.mjs (marker format validation)          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Level 1 — Code Quality Evals

### StrykerJS (Mutation Testing)

**What it does:** Injects artificial bugs (mutants) into your code and checks
if your test suite catches them. A test suite with 90% coverage but 40%
mutation score is lying — it executes code without asserting behavior.

**When it runs:**
- CI: `.github/workflows/evals.yml` on every PR touching lib/ or app/
- Local: `npm run test:mutation` or `trellis eval`
- SDD: the `verify` phase requires a mutation score check

**What it catches that coverage misses:**

```
Original code:                    Test assertion:
function isAdult(age) {           expect(isAdult(18)).toBe(true)
  return age >= 18;               expect(isAdult(17)).toBe(false)
}

Mutant (Stryker changes >= to >):  Test result:
function isAdult(age) {            isAdult(18) -> true (still passes!)
  return age > 18;                 isAdult(17) -> false (still passes!)
}
                                   Mutation score: 0% — test doesn't
                                   actually verify the boundary!
```

**Configuration:** `stryker.config.json`

```json
{
  "mutate": ["lib/**/*.ts", "app/**/*.ts"],
  "thresholds": { "high": 80, "low": 60, "break": 50 },
  "testRunner": "vitest"
}
```

The `break: 50` threshold means: if less than 50% of mutants are killed, CI
fails. You can tune this per project.

**Performance tip:** Mutation testing is inherently slow. For large codebases,
use incremental mode (`--incremental`) and `enableFindRelatedTests` to only
mutate code touched by the current PR.

**License:** Apache-2.0. Created by the Stryker Mutator team.
See [docs/credits.md](credits.md).

---

### fast-check (Property-Based Testing)

**What it does:** You define invariants (properties that must always hold),
and fast-check generates hundreds of test cases automatically — including edge
cases you would never think to write.

**When it runs:**
- Integrated into your normal Vitest test suite (no separate step)
- Local: `npm test` runs property tests alongside unit tests

**Example: cart total property test**

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('cart total', () => {
  it('total is never negative', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (prices) => {
        const total = calculateCartTotal(prices);
        expect(total).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('total equals sum of prices', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0 })), (prices) => {
        const total = calculateCartTotal(prices);
        expect(total).toBe(prices.reduce((a, b) => a + b, 0));
      })
    );
  });
});
```

fast-check generates hundreds of random price arrays, including edge cases:
empty arrays, single items, zero values, very large values, negative values.

**What it catches:** Edge cases example-based tests miss. Especially valuable
for AI-generated code where the agent may not think of all boundary conditions.

**License:** MIT. Created by Nicolas Dubien. See [docs/credits.md](credits.md).

---

## Level 2 — Regression Prevention

### Golden Tests (Per-Spec Locked Suites)

**What it does:** When a spec ships, its verify.md test cases are frozen into
a golden test suite. Any future change that breaks a golden test fails CI.

**When it runs:**
- CI: `.github/workflows/evals.yml`
- SDD: when a spec's `verify.md` is marked COMPLETE, its tests are frozen
- Local: `npx vitest run tests/golden` (created by the adopting project)

**How it works:**

```
Spec 003 ships → verify.md has 5 test cases → frozen into:
tests/golden/003-latest-arrivals-sorting.test.ts

Three months later, someone refactors the sorting module.
The golden test catches the regression before it ships.
```

**Adding a golden test:**

1. When a spec's verify.md flips to COMPLETE, copy its test files into a golden suite
2. Naming: `tests/golden/<NNN>-<slug>.test.ts` (the project creates this directory)
3. Future changes must keep these tests passing

---

## Level 3 — Agent Quality

### Arize Phoenix (Self-Hosted Observability)

**What it does:** Traces every AI agent turn — token cost, tool calls,
failures, time per task. LLM-as-judge evaluations. Prompt playground.

**License note:** Phoenix is Elastic License 2.0 (ELv2). This is source-available
and free to self-host with ALL features included (unlike Langfuse which gates
LLM-as-judge behind paid tier). It is NOT OSI-certified open source. If your
project requires strict OSI-only licenses, replace with Langfuse (MIT core,
but fewer free features). See [DESIGN.md](./DESIGN.md) and [docs/credits.md](credits.md).

**When it runs:**
- Always-on in the background once instrumented
- Dashboard: `http://localhost:6006` after `docker compose -f docker-compose.phoenix.yml up -d`

**What it tells you:**
- Which agent tasks take longest (bottleneck detection)
- Where agents fail (root-cause patterns)
- Token cost per task type (budget optimization)
- LLM-as-judge: automated quality scoring of agent outputs

**Setup:**

```bash
# Start Phoenix
docker compose -f docker-compose.phoenix.yml up -d

# Instrument your code (example for a Node.js agent)
# See: https://docs.arize.com/phoenix
```

---

## Level 4 — Framework Health

These evals check the FRAMEWORK itself, not your project code. They ensure
Trellis's own integrity. They run in CI on every PR.

### check-agnostic.mjs (Stack-Agnostic Enforcement)

**What it does:** Scans framework-core files for stack-specific identifiers
(Supabase, Stripe, React, Next.js, etc.) and flags any that appear where they
shouldn't.

**Why:** Trellis must work for ANY stack. If a framework file hardcodes
"Supabase" into AGENTS.md, it fails the agnostic check. Stack-specific
configuration belongs in the adapted constitution, not the framework core.

**The allowlist:** `scripts/agnostic-allowlist.json` lists files explicitly
permitted to reference specific stacks (e.g., `.env.example` which shows
Supabase as an example).

**Example output:**
```
FAIL: docs/coding-standards.md line 42 contains "React Server Components"
      Framework files must be stack-agnostic. Move stack-specific guidance to
      the adapted constitution or a project-specific doc.
```

### check-mandate-sync.mjs (Mandate File Integrity)

Verifies AGENTS.md and CLAUDE.md are byte-identical (after stripping the
auto-generated header). Run with `--fix` to sync them.

### check-command-sync.mjs (Command Mirror Integrity)

Verifies all platform command mirrors (.claude/, .codex/, .opencode/,
.github/) match the source in `.specify/templates/commands/`.

### check-graph-freshness.mjs (Knowledge Graph Freshness)

If Graphify is installed, verifies the knowledge graph is not stale (more
than N commits behind HEAD).

### check-migration-safety.mjs (Database Migration Evals)

Static checks: unique version numbers, RLS on new tables, FK delete rules.

### check-ponytail.mjs (Marker Format Validation)

Validates `# ponytail:` and `# trellis:` markers have the required format
(ceiling + upgrade path, or reason). Always exits 0 — advisory, non-blocking.

---

## When Each Eval Runs (Matrix)

```
┌─────────────────────┬──────┬───────┬──────────┬─────────┬──────────┐
│ Eval                │ Tier │ CI    │ Pre-merge│ SDD     │ Evolution│
├─────────────────────┼──────┼───────┼──────────┼─────────┼──────────┤
│ StrykerJS           │  2   │  Y    │  Y       │ verify  │    Y     │
│ fast-check          │  2   │  Y*   │  Y*      │ verify  │    Y     │
│ Golden tests        │  2   │  Y    │  Y       │ verify  │    Y     │
│ Arize Phoenix       │  3   │  —    │  —       │  —      │    Y     │
│ check-agnostic      │  1   │  Y    │  Y       │  all    │    Y     │
│ check-mandate-sync  │  1   │  Y    │  Y       │  all    │    Y     │
│ check-command-sync  │  1   │  Y    │  Y       │  all    │    Y     │
│ check-graph-fresh   │  2   │  Y    │  Y       │  all    │    Y     │
│ check-migration     │  1   │  Y    │  Y       │  impl   │    Y     │
│ check-ponytail      │  1   │  Y    │  —       │  review │    Y     │
└─────────────────────┴──────┴───────┴──────────┴─────────┴──────────┘
* fast-check runs as part of the normal test suite, not a separate CI step.
```

---

## Running Evals

```bash
# Run ALL evals
trellis eval
# or: node scripts/run-evals.mjs

# Run specific evals
npm run test:mutation           # StrykerJS only
npm test                        # Unit + property tests (fast-check)
npx vitest run tests/golden     # Golden tests only
npm run check                   # All framework health checks

# Run the full eval suite (evals + framework checks)
trellis check
```

---

## How Evals Connect to the SDD Pipeline

```
Specify ─→ Clarify ─→ Plan ─→ Tasks ─→ Checklist ─→ Analyze ─→ Implement ─→ Review ─→ Verify
                                                              │            │         │
                                                              ▼            ▼         ▼
                                                         migration    ponytail   ALL EVALS
                                                         safety       review     run here
                                                         check        (advisory)
```

The `verify` phase is where ALL code quality evals run. Nothing ships until:
- Mutation score meets threshold
- Property tests pass
- Golden tests pass
- Coverage threshold met
- Framework health checks pass
