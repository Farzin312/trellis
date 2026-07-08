---
name: api-routes
description: |
  Implement and review API routes following the standard auth, status,
  role, rate-limit, validation, database, audit, response sequence.
  Use when creating or modifying backend endpoints, routes, or handlers
  in any language or framework. Auto-loads when file paths match
  app/api/**, routes/**, src/routes/**, handlers/**, or controllers/**.
version: 1.0.0
---

# API Route Discipline

## Overview

Build backend handlers that follow the required security and validation
sequence, use shared helpers, and match documented endpoint behavior.
Works for any framework: Express, Fastify, Hono, Next.js API routes,
FastAPI, Flask, Gin, Echo, Actix, Axum, Django views, Rails controllers.

## The 8-Step Sequence (every route, every framework)

1. **Authentication** - verify identity via your auth provider's helper.
   No anonymous access unless explicitly designed as public.
2. **Status check** - verify account is active, not suspended/banned.
3. **Role check** - verify the caller has permission for this operation.
4. **Rate limiting** - apply rate limits on write and abuse-prone endpoints.
5. **Input validation** - validate request body, params, query. Return 400
   on invalid input. Never trust client data.
6. **Database operation** - use your project's data access helpers, not
   raw queries in the route handler.
7. **Audit log** - write audit entries for sensitive operations (role
   changes, money, state transitions, deletes).
8. **Response** - return consistent response format with proper status
   codes. Set cache headers appropriately.

Skipping or reordering is not permitted.

## When to Load

Load this skill when:
- Creating a new endpoint, route, or handler
- Modifying an existing route's logic
- Reviewing a PR that touches API routes
- The delegation matrix routes you here

## Consistency Checks

- Do not duplicate business logic in frontend code
- Do not bypass auth/DB helpers for shortcuts
- Ensure response types align with your types/ definitions
- Money is always integer cents (or equivalent), never float
- Error responses include a concrete cause and next step

## Audit Triggers (must log)

- Create/update/delete on sensitive tables
- Role, status, moderation, or permission changes
- Money-related operations (payments, refunds, payouts)
- Inventory and pricing changes

## Output Expectations

Return:
- List of files created or modified
- Which of the 8 steps are implemented
- Any security concerns flagged
- Documentation that needs updating (which doc files)
