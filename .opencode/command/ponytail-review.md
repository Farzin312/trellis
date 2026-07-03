---
name: ponytail-review
description: |
  Flag potential over-engineering during code review. Advisory only,
  never blocks. Use during the SDD Review phase to catch unnecessary
  abstractions, premature config, and unjustified complexity. Auto-loads
  at /review phase boundary. Based on Ponytail by Dietrich Gebert.
version: 1.0.0
---

# Ponytail Review

## Overview

Ponytail is a default posture: start with the simplest solution that
works. This skill flags where code has gone beyond lazy without
justification. It is ADVISORY ONLY - it never blocks a build or merge.
The reviewer decides whether to act on the flags.

## Scale-Aware Assessment

Ponytail is not "always write less." It is "write the right amount for
the CURRENT scale, with a documented path to the NEXT scale."

Three scale tiers the reviewer must identify before flagging:

STARTUP (< 1K LOC, < 5 endpoints, single user type):
  Default: simplest thing that works. Flag aggressively.
  Tolerated: none. Even auth can use a provider's default.

GROWING (1K-50K LOC, 5-30 endpoints, multiple user types):
  Default: simple with clear seams. Flag premature abstractions.
  Tolerated: one layer of indirection where a public interface
  serves 2+ callers. State machines for multi-step flows.
  Required: separation between data access and business logic.

SCALE (50K+ LOC, 30+ endpoints, multiple services or teams):
  Default: explicit interfaces, dependency injection, documented
  contracts. Do NOT flag these as over-engineering.
  Tolerated: interface segregation, adapter patterns, event buses.
  Required: subsystem boundary manifests (Bounds), audit trails.

The reviewer MUST identify the project's scale tier before flagging.
What is over-engineering at STARTUP is REQUIRED at SCALE.

## What to Flag (by tier)

### Unnecessary Abstraction (flag at any tier)
- Single-implementation interfaces at STARTUP tier
- Premature generalization (parameterizing for a second use case that
  does not exist yet) at STARTUP or GROWING tier
- Factory pattern where direct construction works (STARTUP)
- Config systems for values that are always the same (any tier)

### Over-Engineering (flag at any tier)
- 50+ line solution for a 5-line problem WITH no documented scale need
- Complex state machine where a boolean would work (STARTUP only)
- Plugin architecture with one plugin (any tier)
- Feature flags for features that will never be toggled (any tier)

### NOT Over-Engineering (do NOT flag at GROWING/SCALE)
- Interface with 2+ implementations at GROWING tier
- Dependency injection at SCALE tier
- Event bus / message queue at SCALE tier with documented throughput need
- State machine for order/payment/fulfillment flows at GROWING+
- Separated data access layer at GROWING+
- Audit logging infrastructure at SCALE tier

### Premature Optimization (flag unless at SCALE with evidence)
- Micro-optimizations without profiling evidence
- Caching before measuring cache hit rates
- Connection pooling for a single-user tool
- Custom serialization before benchmarking standard formats

## Marker Format

When you deliberately simplify, mark it:
  # ponytail: <ceiling>, upgrade: <path>
  Example: # ponytail: in-memory cache, upgrade: Redis when >1K QPS

When you deliberately go beyond lazy, mark it:
  # trellis: full-impl, <reason>
  Example: # trellis: full-impl, needs to handle concurrent writes

CI validates marker FORMAT only (ceiling + upgrade present, or reason
present). It never blocks builds.

## When to Load

Load this skill when:
- Running the SDD Review phase
- Reviewing a PR for over-engineering
- The delegation matrix routes you here

## What Ponytail is NOT

- Not a hard gate. Never blocks a build.
- Not always right. Stdlib has bugs. One-liners hide edge cases. Some
  abstractions are genuinely needed.
- Not about writing less code. It's about writing the RIGHT amount.

## Output Expectations

Return:
- List of over-engineering flags (advisory)
- For each flag: file:line, what's over-engineered, simpler alternative
- List of well-formed markers found
- Any markers with format issues (for CI validation)
