---
name: security-review
description: |
  Audit authentication, authorization, money paths, RLS, and input
  validation surfaces. Use when changes touch auth, payments, user
  data, permissions, or security-sensitive code. Auto-loads during
  SDD Plan phase for security risks and Analyze phase for cross-cutting
  concerns. Findings on auth/money are BLOCKING.
version: 1.0.0
---

# Security Review

## Overview

Audit security-sensitive code changes for vulnerabilities. Focus on
auth, money, data access, and input handling. Findings are BLOCKING
for auth/money/RLS, ADVISORY for everything else.

## Audit Checklist

### Authentication
- [ ] Every non-public route verifies identity
- [ ] Auth checks fail closed (deny by default)
- [ ] No alternative auth source bypasses the primary provider
- [ ] Session/token validation uses the project's auth helper, not custom

### Authorization
- [ ] Role checks use the project's role helper
- [ ] Status checks (active/suspended/banned) enforced
- [ ] Privilege escalation impossible via parameter manipulation

### Money (if applicable)
- [ ] Money stored as integer cents (or smallest currency unit), never float
- [ ] Payment status comes from webhook/provider, not client
- [ ] Refund/payout operations are idempotent
- [ ] Money tables are backend-only (no client writes)
- [ ] Price manipulation (negative, zero, overflow) impossible

### Data Access
- [ ] RLS enabled on all public tables (SQL-based tools)
- [ ] No IDOR (Insecure Direct Object Reference) vulnerabilities
- [ ] Query parameters validated and scoped to the caller
- [ ] Bulk operations have batch limits

### Input Validation
- [ ] All inputs validated server-side
- [ ] Never trust client input
- [ ] Sanitize user content before storage (XSS prevention)
- [ ] File uploads validated by type and size

### Secrets
- [ ] No secrets in code, logs, or error messages
- [ ] Environment variables read through centralized helpers
- [ ] API keys not exposed to the client

## When to Load

Load this skill when:
- Changes touch auth, money, payments, or user data
- SDD Plan phase (security risk assessment)
- SDD Analyze phase (cross-cutting security audit)
- The delegation matrix routes you here

## Finding Severity

- **BLOCKING**: auth bypass, money vulnerability, RLS gap, IDOR,
  secret exposure, injection vulnerability. Must fix before merge.
- **ADVISORY**: defense-in-depth improvements, rate limiting gaps,
  logging improvements. Flag for discussion, don't block merge.

## Output Expectations

Return:
- List of findings with severity (BLOCKING/ADVISORY)
- For each BLOCKING: exact file:line, what's wrong, how to fix
- Overall PASS/FAIL verdict
