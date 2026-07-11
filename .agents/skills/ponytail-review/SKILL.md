---
name: ponytail-review
description: Review a change for unnecessary code, dependencies, indirection, configuration, and speculative flexibility. Use during post-implementation review or when a solution appears more complex than its demonstrated requirements. Advisory only.
---

# Simplicity review

Review requirements, changed code, current callers, and measured constraints.
Flag only complexity that lacks present evidence:

- a dependency replaced by a small standard-library operation;
- an interface, factory, plugin, or registry with one foreseeable implementation;
- configuration for a value that is not genuinely variable;
- duplicated adapters or compatibility copies with a canonical native surface;
- caching, concurrency machinery, or custom serialization without measurements;
- dead code, stale fallbacks, misleading comments, or unreachable flexibility;
- a large solution whose edge cases are already handled by a simpler primitive.

Do not flag complexity required by security, data integrity, concurrency,
compatibility, observability, or multiple proven callers. Repository size alone
does not justify or invalidate an abstraction.

Return one line per finding: `file:line — cost — simpler alternative — evidence
needed to keep it`. Separate deletions that are safe now from follow-ups needing
migration or owner choice. Findings are advisory; correctness and security gates
remain blocking.
