---
name: db-migrations
description: Plan, implement, and review database schema migrations. Use when changing tables, columns, constraints, indexes, policies, functions, triggers, backfills, or migration-tool configuration.
---

# Database migrations

1. Identify the configured migration tool from explicit project evidence. Do not
   infer a tool from an ambiguous `migrations/` directory.
2. Inspect current schema, data volume, access policy, naming, and deployment
   order before designing the delta.
3. Specify nullability, defaults, constraints, indexes, foreign-key delete
   behavior, authorization policy, and backfill semantics.
4. Separate expand, migrate, and contract steps when old and new application
   versions can overlap or a table is large.
5. Make retries safe. Avoid long locks, table rewrites, and irreversible data loss;
   document recovery when a down migration is unsafe.
6. Apply least privilege. If the database supports row-level policy, enable and
   test it according to the project's trust model rather than assuming a provider.
7. Run the migration tool's real validation or disposable-database round trip.
   Also run `.trellis/scripts/check-migration-safety.mjs`; treat its static output
   as supplemental evidence, not proof that the migration applies.
8. Update schema and operational docs in the same change.

For money, use the established fixed-point or smallest-unit representation.
Never rewrite an already-applied migration without an explicit incident-recovery
procedure.

Return the schema delta, compatibility and lock risks, policy effects, migration
path, rollback or recovery plan, and empirical evidence.
