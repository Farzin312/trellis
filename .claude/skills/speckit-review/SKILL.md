---
name: speckit-review
description: Review a completed Trellis implementation for requirement drift, defects, security gaps, boundary violations, documentation mismatch, and unnecessary complexity. Use after Implement and before Verify.
---

# Review

Review every changed file and the resulting behavior against the spec, contracts,
tasks, coding standards, and current subsystem conventions.

Check correctness, failure handling, validation, types, idempotency, concurrency,
public/private boundaries, security, accessibility where relevant, tests, and
living documentation. Use `security-review` for trust boundaries and
`ponytail-review` for advisory simplicity findings.

Write `review.md` with evidence-backed findings ordered by severity, exact paths,
and disposition. Correctness, security, data-integrity, and boundary findings are
blocking. Advisory simplicity findings do not override a required safe design.

Fix blocking findings and repeat the review before proceeding.

Next: `speckit-verify`.
