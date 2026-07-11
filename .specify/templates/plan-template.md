# Plan: <feature name>

> Spec: <NNN>

## Architecture and ownership

Describe the smallest coherent solution, its subsystem owner, dependency
direction, data flow, and rollout sequence.

## Contracts

List changed public interfaces, callers, request or input shape, response or
output shape, stable errors, and compatibility behavior. Link a `contracts/`
directory when one table would be unclear.

## Data and state

Describe persisted data, state transitions, constraints, idempotency,
concurrency, migration, and recovery when applicable.

## Risks

| Risk | Impact | Mitigation | Detection | Recovery |
|---|---|---|---|---|
| <risk> | <impact> | <mitigation> | <evidence> | <recovery> |

## Test strategy

Map requirements to the smallest useful test layers and feature-specific
verification. Identify external proof separately.

## Complexity decisions

Explain any dependency, abstraction, compatibility layer, or operational
machinery that is not already justified by current requirements.
