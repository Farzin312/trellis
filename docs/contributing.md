# Contributing to Trellis

> Parent: `docs/README.md`

Trellis is open source (MIT). Contributions welcome. This guide explains how.

## The One Rule

Trellis must work for ANY project, not just one stack. Every contribution is
checked against this principle.

## Before You Contribute

1. Read [DESIGN.md](./DESIGN.md) — the 5 design principles.
2. Read [MASTERPLAN.md](../MASTERPLAN.md) — the current build status.
3. Run `node scripts/check-agnostic.mjs` — your changes must pass this.

## What You Can Contribute

### Framework improvements (Trellis itself)
- New eval scripts
- New handoff specialists
- CI workflow improvements
- Documentation improvements
- Evolution agent enhancements
- Bug fixes in existing scripts

### Stack adapters
- New detection patterns for `adapt-to-project.mjs` (e.g., detect a new
  frontend framework)
- New constitution adaptation rules for a specific stack

### Tool integrations
- Wire up a new open-source tool (verify license is free/open-source first)
- Improve existing tool integration configs

## Process

Trellis uses its own SDD pipeline for framework changes:

1. Fork and clone
2. Create a spec: `/specify <your change>`
3. Follow the SDD flow through verify
4. `node scripts/check-agnostic.mjs` must pass
5. `npm run docs:check` must pass
6. Open a PR

## What Gets Rejected

- Changes that hardcode a specific stack into framework-core files
- Changes that add non-free dependencies to the core framework
- Changes that bypass the SDD pipeline for non-trivial work
- Changes that remove a universal principle without justification

## Credit

Contributors are credited in release notes. Significant contributions get a
mention in docs/credits.md.
