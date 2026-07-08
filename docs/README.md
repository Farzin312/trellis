# __PROJECT_NAME__ — Documentation Index

> Parent: [root `README.md`](../README.md)
> Children: [`STRUCTURE.md`](./STRUCTURE.md), [`SYSTEM.md`](./SYSTEM.md), [`DESIGN.md`](./DESIGN.md), [`README-FOR-AGENTS.md`](./README-FOR-AGENTS.md), [`coding-standards.md`](./coding-standards.md), [`skills.md`](./skills.md), [`language-support.md`](./language-support.md), [`evals.md`](./evals.md), [`metrics.md`](./metrics.md), [`evolution.md`](./evolution.md), [`self-hosted-services.md`](./self-hosted-services.md), [`ponytail-setup.md`](./ponytail-setup.md), [`credits.md`](./credits.md), [`contributing.md`](./contributing.md), [`_subsystem-template.md`](./_subsystem-template.md), [`sdd/sdd.md`](./sdd/sdd.md), [`bug-fixes/_template.md`](./bug-fixes/_template.md)

This is the single entry point for documentation. If you don't know where to look, start here.

The docs follow a parent -> children breadcrumb pattern: every file declares its parent at the top. AI agents and humans both use these breadcrumbs to walk the tree without guessing.

## Map

```
docs/
├── README.md                  ← you are here (human entry point)
├── README-FOR-AGENTS.md       ← AI agent entry point
├── STRUCTURE.md               ← documentation rules (single source of truth)
├── SYSTEM.md                  ← full system architecture diagram
├── DESIGN.md                  ← design decisions + framework-agnostic allowlist
├── coding-standards.md        ← what "good code" means
├── evals.md                   ← the eval system (mutation, golden, Phoenix)
├── metrics.md                 ← token cost & per-agent metrics ledger
├── evolution.md               ← self-evolution engine
├── skills.md                  ← how skills work + how to create them
├── language-support.md        ← supported stacks + eval tooling per language
├── self-hosted-services.md    ← Phoenix, Mem0, and other optional services
├── ponytail-setup.md          ← ponytail plugin install guide
├── credits.md                 ← tool credits + licenses
├── contributing.md            ← how to extend Trellis
├── _subsystem-template.md     ← copy when creating a subsystem doc
├── sdd/
│   └── sdd.md                 ← Spec-Driven Development policy
├── systems/                   ← durable domain/subsystem docs
├── bug-fixes/                 ← append-only register of production fixes
│   └── _template.md
├── api-reference/             ← auto-generated from API route JSDoc
├── database/                  ← schema notes
├── frontend/                  ← Lighthouse / a11y / asset standards
└── archive/                   ← retired docs kept for context
```

Plus, at the repo root:

```
.specify/specs/<NNN>-<slug>/      ← SDD ledger — one folder per change
AGENTS.md                       ← cross-tool AI agent mandate
```

## Where to look

| Question | Doc |
|----------|-----|
| How do I create skills for AI agents? | [`skills.md`](./skills.md) |
| What languages and tools are supported? | [`language-support.md`](./language-support.md) |
| How do I set up self-hosted services? | [`self-hosted-services.md`](./self-hosted-services.md) |
| How does the whole system fit together? | [`SYSTEM.md`](./SYSTEM.md) |
| What design decisions were made? | [`DESIGN.md`](./DESIGN.md) |
| How does the SDD spec workflow work? | [`sdd/sdd.md`](./sdd/sdd.md) |
| How does the eval system work? | [`evals.md`](./evals.md) |
| How do I track token costs per agent? | [`metrics.md`](./metrics.md) |
| What conventions does this repo follow? | [`coding-standards.md`](./coding-standards.md), [`AGENTS.md`](../AGENTS.md) |
| How should documentation be structured? | [`STRUCTURE.md`](./STRUCTURE.md) |
| Where is the function I need? | The owning subsystem doc at [`systems/`](./systems/) |
| How do I install Ponytail? | [`ponytail-setup.md`](./ponytail-setup.md) |
| What tools does Trellis use? | [`credits.md`](./credits.md) |
| How do I contribute to Trellis? | [`contributing.md`](./contributing.md) |

## The 4-doc pattern

Every domain needs at most four kinds of docs: walkthrough (lifecycle map), file:function map, state machines & invariants, bug-fixes register. If you can't fit knowledge into one of these four, ask whether it should exist as a doc at all.
