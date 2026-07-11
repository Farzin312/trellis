# Repository constitution

This constitution defines durable project principles. Feature specifications
may specialize them but may not silently contradict them.

## I. Evidence before claims

Public capability claims require executable behavior, deterministic metadata,
or clearly identified external evidence. `SKIP` and `WARN` are never passes.

## II. Spec-driven non-trivial work

Use the complete phase order:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

Keep the chain under `.specify/specs/` and preserve open external-proof gaps.

## III. Safe project boundaries

Trellis changes only Trellis-owned surfaces during generation and adaptation.
Brownfield adoption is a reviewed merge. The toolkit does not configure
application authentication, authorization, money, secrets, or database policy.

## IV. Minimal, portable core

Core behavior uses Node.js standard-library APIs, explicit inputs, stable exit
codes, and no runtime package dependencies. Optional integrations remain
optional and keep their own licenses and prerequisites.

## V. One source per concept

`AGENTS.md` is the mandate, `.agents/skills/` is the canonical skill tree, code
is current runtime behavior, and living docs explain that behavior. Generated
mirrors and historical records never become competing sources of truth.

## VI. Reversible and repeatable operations

Validate before writing, preserve user-owned files, make repeated setup safe,
and publish multi-file results atomically where partial state would mislead.

Amend this constitution through the normal SDD workflow with rationale, impact,
and verification recorded in the feature chain.
