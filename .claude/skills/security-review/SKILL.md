---
name: security-review
description: Audit authentication, authorization, user data, secrets, payments, uploads, input validation, abuse controls, and database access. Use when a change crosses a trust boundary or handles sensitive state.
---

# Security review

Map actors, assets, entry points, trusted components, and failure impact. Then
inspect the relevant controls:

- authentication validates credentials and sessions through the established seam;
- authorization checks the action and resource, defaults to deny, and prevents
  tenant or object-reference leaks;
- all untrusted input is structurally validated before side effects;
- queries, templates, commands, redirects, and file paths resist injection;
- secrets do not enter source, logs, client bundles, errors, or persisted prompts;
- uploads enforce size, type, storage, and serving policy at a trusted boundary;
- money and privileged mutations use exact representation, idempotency, trusted
  provider state, and auditable transitions;
- rate limits, replay defenses, and concurrency controls match the abuse model;
- database and storage permissions enforce least privilege independently of UI;
- errors fail closed without hiding operational causes from maintainers.

Test bypass attempts and negative cases, not only helper presence. Distinguish a
confirmed vulnerability from defense-in-depth advice and uncertain external
configuration.

Return findings ordered by severity with `file:line`, exploit or failure path,
affected asset, smallest safe fix, and verification. Any plausible auth bypass,
cross-tenant access, secret exposure, injection, or money-integrity failure is
blocking until resolved or disproved.
