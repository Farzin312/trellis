# Requirements checklist

> Spec: <NNN>

Complete this before Analyze. It validates artifact quality, not implementation.

## Requirements and scope

- [ ] Every requirement is observable, unambiguous, and traceable to a task.
- [ ] Every success criterion has a planned verification method.
- [ ] Assumptions, edge cases, invariants, and out-of-scope items are explicit.
- [ ] Security, validation, compatibility, and recovery requirements are present
      when the feature needs them.

## Plan and contracts

- [ ] The plan satisfies each requirement without contradictory decisions.
- [ ] Every changed public contract defines caller, inputs, outputs, errors, and
      compatibility behavior.
- [ ] Ownership and dependency direction are clear.
- [ ] Risks have mitigation, detection, and recovery where applicable.

## Test strategy

- [ ] Behavior tasks have a test that fails for the intended reason first.
- [ ] Happy, invalid, unauthorized, dependency-failure, concurrency, and retry
      paths are covered as applicable.
- [ ] Optional tools or external proof are identified as such, not counted as
      local passed evidence.

## Result

**Result: PASS / FAIL**

If FAIL, list the owning artifact and required correction. Analyze remains
blocked until the updated checklist passes.
