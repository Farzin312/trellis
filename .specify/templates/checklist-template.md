# Requirements Checklist

> Spec: NNN

Fill BEFORE Analyze. Validates spec quality, not code.

## Completeness

- [ ] Every FR-XXX has a corresponding task in tasks.md
- [ ] Every SC-XXX has a corresponding task in tasks.md
- [ ] Every AUTH-XXX has a corresponding task in tasks.md
- [ ] Every VAL-XXX has a corresponding task in tasks.md
- [ ] Every INV-XXX is referenced in plan.md or risks.md
- [ ] Every EDGE-XXX has a guard or test

## Contracts

- [ ] Every API endpoint in contracts.md has auth, request shape, response shape, error codes
- [ ] No two contracts contradict each other
- [ ] Frontend consumes only what contracts.md defines

## Test Strategy

- [ ] Every FR has at least one test
- [ ] Test strategy covers happy path + error path + edge cases
- [ ] Property-based tests defined for invariant-heavy logic (if fast-check configured)
- [ ] Mutation testing target areas identified (if stryker configured)

## Ponytail Review

- [ ] No over-specification (simplest spec that captures requirements)
- [ ] Marked expansions: `# trellis: full-impl, <reason>`

## Result

**Result: PASS / FAIL**

If FAIL, list the gaps. Analyze is blocked until PASS.
