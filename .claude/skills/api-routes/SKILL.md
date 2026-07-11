---
name: api-routes
description: Implement or review backend endpoints, route handlers, controllers, and HTTP contracts. Use when a change adds or alters request parsing, authentication, authorization, rate limits, data access, side effects, errors, or responses.
---

# API route discipline

Follow the adopting project's framework and shared helpers. For each route:

1. Define method, path, caller, request schema, response schema, and stable errors.
2. Mark the route public or authenticate with the established identity seam.
3. Authorize the requested action and resource; do not infer access from identity.
4. Apply account-state and abuse controls when the threat model requires them.
5. Validate path, query, headers, and body before side effects.
6. Call a domain or data-access seam; keep duplicated business logic out of handlers.
7. Make retries and partial failures safe for mutations. Audit sensitive actions.
8. Return the documented status, body, and cache behavior without leaking secrets.

Preserve error causes internally and expose only safe, actionable client errors.
Represent money with the project's exact fixed-point or smallest-unit contract,
never binary floating point.

Test the happy path, malformed input, unauthenticated caller, unauthorized caller,
missing resource, conflict or retry, and dependency failure as applicable. Update
the endpoint catalog or living API docs in the same change.

Return changed paths, contract changes, evidence run, and unresolved security
concerns.
