---
name: db-migrations
description: |
  Plan and implement database schema changes with correct RLS, audit,
  money, and documentation. Use when editing migration files, creating
  schema changes, or modifying table structures. Auto-loads when file
  paths match */migrations/**, */migration/**, supabase/migrations/**,
  prisma/migrations/**, alembic/versions/**, db/migrate/**.
  Works with Supabase, Prisma, Drizzle, Flyway, Alembic, Rails, Django,
  Knex, golang-migrate, TypeORM, Goose, Atlas, Sequelize, node-pg-migrate,
  Liquibase.
version: 1.0.0
---

# Database Migrations

## Overview

Create forward-only migrations that preserve invariants, enforce RLS
where applicable, and keep documentation in sync. Detects your migration
tool automatically.

## Migration Workflow

1. Identify the feature scope in your spec or feature doc.
2. Locate existing tables or policies in your database reference docs.
3. Create a new migration file in the correct directory for your tool:
   - Supabase: `supabase/migrations/*.sql`
   - Prisma: `prisma/migrations/*/migration.sql`
   - Drizzle: `drizzle/*.sql` or `migrations/*.sql`
   - Alembic: `alembic/versions/*.py`
   - Rails: `db/migrate/*.rb`
   - Django: `<app>/migrations/*.py`
   - Knex: `migrations/*.js`
   - Flyway: `db/migration/V*__*.sql`
   - golang-migrate: `migrations/*_up.sql`
   - TypeORM: `migrations/*.ts`
   - Goose: `migrations/*.sql`
   - Atlas: `migrations/*.sql`
   - Sequelize: `migrations/*.js`
   - node-pg-migrate: `migrations/*.js`
   - Liquibase: `db/changelog/*.xml`
4. Apply database conventions (see below).
5. Add indexes, constraints, and triggers alongside table changes.
6. Run: `node scripts/check-migration-safety.mjs` to verify.
7. Update documentation in the same change-set.

## Database Conventions (universal)

- Table names: `snake_case` plural (or your framework's convention)
- Primary keys: UUID with `gen_random_uuid()` default, or auto-increment
  (match your project's existing pattern)
- Money: integer (cents or smallest currency unit), NEVER float
- Timestamps: `timestamptz` with `now()` default (SQL), or your ORM's
  equivalent
- Public tables (SQL-based tools): RLS enabled with explicit policies
- Money and audit tables: backend-only writes, no client access
- Forward-only: never rewrite or squash existing migrations

## RLS Guardrails (SQL-based tools only)

Tools where RLS is directly checkable: Supabase, Drizzle, Flyway, Alembic,
golang-migrate, Goose, Atlas, node-pg-migrate, Liquibase.

- Default to deny; grant minimum required access
- Every public table must have RLS enabled
- Policies must match your project's auth model
- Audit and payment tables must not have client-write policies

Tools where RLS is NOT directly checkable (skip with note): Prisma, Rails,
Django, Knex, TypeORM, Sequelize. Document RLS in raw SQL or schema config.

## When to Load

Load this skill when:
- Creating or modifying migration files
- Changing table structure, policies, triggers, or functions
- The delegation matrix routes you here (Implement phase, migration paths)

## Output Expectations

Return:
- Summary of schema changes and policy effects
- Migration file path
- Which docs need updating
- Verification: check-migration-safety.mjs result (PASS or specific failures)
