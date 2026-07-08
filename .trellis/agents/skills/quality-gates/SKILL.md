---
name: quality-gates
description: |
  Pre-merge correctness sweep. Runs lint, build, test, mutation, and
  documentation checks. Use during the SDD Verify phase or before any
  merge. Verifies that test count did not decrease, all CI checks pass,
  and documentation is in sync. Auto-loads at /verify phase boundary.
version: 1.0.0
---

# Quality Gates

## Overview

The final gate before code ships. Runs every check in sequence and
reports PASS/FAIL for each. Nothing merges until all gates pass.

## Gate Sequence (run in order)

1. **Lint** - `npm run lint` (or your project's linter)
   - Exits 0 = PASS
   - Includes: mandate sync, command sync, docs check, stack-agnostic

2. **Build** - `npm run build` (or your project's build command)
   - Succeeds = PASS
   - If no build step, skip with note

3. **Test suite** - `npm test` (or equivalent)
   - All tests pass = PASS
   - Test count MUST NOT decrease from baseline
   - If no tests exist yet, WARN (non-blocking)

4. **Mutation testing** (if configured) - `npm run test:mutation`
   - Score >= threshold = PASS
   - Default threshold: 50 (adjustable per project)
   - If StrykerJS/mutmut/cargo-mutants not installed, SKIP with note

5. **Migration safety** - `node .trellis/scripts/check-migration-safety.mjs`
   - PASS or SKIP (no migrations) = OK
   - Any FAIL = blocking

6. **Docs sync** - `npm run docs:check`
   - No drift = PASS
   - Any broken links or missing breadcrumbs = blocking

7. **Stack-agnostic** - `node .trellis/scripts/check-agnostic.mjs`
   - PASS = no hardcoded stacks in framework files

8. **Handoff registry** - `node .trellis/scripts/handoff-engine.mjs validate`
   - PASS = registry valid, no duplicate names, no dangling handoff targets

## When to Load

Load this skill when:
- Running the SDD Verify phase
- Before merging any PR
- Before reporting a feature as complete
- The delegation matrix routes you here

## Pass Criteria

- Gates 1-2, 4-8 must PASS or SKIP with clear note
- Gate 3 must PASS (tests exist and pass) or WARN (no tests yet)
- A single FAIL in any blocking gate = feature is not complete

## Test Documentation Gate (mandatory)

Every test file MUST have a header comment documenting its purpose.
This is checked as part of the test gate. Tests without documentation
fail the quality gate.

### Required Test Header Format

Every test file must begin with a structured comment:

  JavaScript/TypeScript:
    /**
     * @testoverview Regression tests for [feature/subsystem]
     * @spec SDD-<NNN> Verify phase
     * @covers [list of FR/SC/AUTH IDs this test protects]
     * @regression Y/N - if Y, this is a locked golden suite
     * @created <YYYY-MM-DD via SDD verify phase>
     */

  Python:
    """Test overview: Regression tests for [feature/subsystem]
    Spec: SDD-<NNN> Verify phase
    Covers: [list of FR/SC/AUTH IDs]
    Regression: Y/N (locked golden suite if Y)
    Created: <YYYY-MM-DD via SDD verify phase>
    """

  Go (GoDoc comment):
    // TestOverview verifies [feature/subsystem] regression behavior.
    // Spec: SDD-<NNN>
    // Covers: [FR/SC IDs]
    // Regression: Y/N

  Rust (doc comment):
    //! Regression tests for [feature/subsystem]
    //! Spec: SDD-<NNN>
    //! Covers: [FR/SC IDs]
    //! Regression: Y/N

### What the Header Tells the Next Agent

1. **@regression Y**: This is a GOLDEN test. Breaking it means a
   regression. Do NOT modify test expectations - fix the code, not
   the test, unless the spec changed through SDD.
2. **@regression N**: This is a current-behavior test. It may be
   updated when behavior intentionally changes via SDD.
3. **@covers [IDs]**: Maps tests to spec requirements. If you delete
   a requirement, you know which tests to revisit.
4. **@spec SDD-<NNN>**: Links the test to its origin spec. Provides
   full context for why this test exists.

### Test Categories

Every test should be categorized in the header:

- **REGRESSION**: Protects against reintroducing a fixed bug. Mark
  with @regression Y. These become golden tests.
- **BEHAVIOR**: Verifies current correct behavior for a spec
  requirement. Mark with @regression N initially. Becomes golden
  when the spec ships.
- **EDGE_CASE**: Tests boundary conditions (empty input, max values,
  concurrent access). May be regression or behavior.
- **INVARIANT**: Property-based tests (fast-check/Hypothesis/etc).
  Tests properties that must always hold, not specific examples.

## Output Expectations

Return:
- Gate-by-gate results table (PASS/FAIL/SKIP/WARN)
- Test documentation compliance check (headers present and correct)
- For any FAIL: exact error message and what to fix
- Overall verdict: SHIP (all pass) or HOLD (fix blocking failures)
