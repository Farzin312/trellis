# Subsystem documentation template

> Parent: [documentation index](./README.md)

Copy this file to `docs/systems/<subsystem>/README.md`, replace every angle-bracket
prompt, and link the new document from `docs/systems/README.md`.

---

# <Subsystem name>

> Parent: [system documentation](../README.md)

## Ownership

State what this subsystem owns and what adjacent subsystems own instead.

## Public surface

List stable functions, commands, events, routes, tables, or files that other
subsystems may use. Link to the current contract where one exists.

## Private internals

Identify directories or symbols that callers must not import or depend on.

## Dependencies and dependents

List allowed outbound dependencies and known consumers. Explain any exception to
the normal dependency direction.

## Invariants and trust boundaries

Document state rules, validation, authorization, sensitive data, concurrency,
and idempotency requirements that must remain true.

## Failure and operation

Describe expected failures, retry behavior, timeouts, logs, alerts, and recovery.
Do not claim observability that the project has not configured.

## Verification

List the focused tests and commands that exercise this subsystem, including
important negative and edge cases.

## Related evidence

Link the living design or API owner first, then relevant completed specifications
and bug-fix records. Historical records do not override this document.
