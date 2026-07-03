# Frontend Standards

> Parent: `docs/README.md`

## Server Components First

All pages and layouts are React Server Components by default. Client components (`"use client"`) only when event listeners, hooks, or browser-only APIs are needed.

## Performance Floor

- LCP element chosen on purpose. One `priority` image per route.
- Static asset budgets: OG image 1200x630 <= 300KB. Hero poster <= 200KB.
- Third-party scripts do not load on first paint (click-to-load pattern).
- Single `<main id="main-content">` per page. Skip link targets it.

## Accessibility Floor

- Color contrast >= 4.5:1 normal text, >= 3:1 large text.
- `aria-label` includes visible text verbatim. Descriptive link text required.
- Dialog/modal/drawer with non-trivial a11y: add entry to `docs/frontend/accessibility-dialog-audit.md`.
- Cookie banner dismiss works without forcing accept/reject.

## Tradeoff Registry

When a UI/asset/metadata change knowingly violates a floor, document it in a tradeoff registry. Silent non-compliance is forbidden.
