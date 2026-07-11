# Coding standards

> Parent: [agent routing guide](./README-FOR-AGENTS.md)

These standards are language-neutral. A subsystem may add stricter rules but
may not weaken safety or verification requirements.

## Design

- Make invalid states difficult to represent and validate input at boundaries.
- Prefer guard clauses, small cohesive functions, and composition.
- Reuse the standard library before adding a dependency or abstraction.
- Keep public surfaces narrow; private implementation details do not cross
  subsystem boundaries.
- Make state transitions, retries, timeouts, and failure ownership explicit.

## Correctness and safety

- Preserve error causes and return actionable failures with stable exit status.
- Avoid shell interpolation for user-controlled values; execute argument arrays.
- Make repeated setup and write operations idempotent. Use temporary files and
  atomic publication where partial output would be harmful.
- Protect concurrent and retried mutations with project-appropriate idempotency
  or locking.
- Treat authentication, authorization, money, secrets, and user data as
  fail-closed trust boundaries. Trellis does not configure application
  authentication for adopting projects.

## Types and tests

- Use the strongest practical type system; avoid unchecked dynamic values at
  module boundaries.
- Pair behavior changes with a failing test first, then the smallest fix.
- Test success, invalid input, repeated execution, dependency absence, and
  partial failure where relevant.
- Do not equate a skipped optional check with successful verification.

## Documentation

Names, examples, CLI help, package scripts, and support claims are public API.
Update them with implementation changes and run `npm run check`.
