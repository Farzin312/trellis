---
name: frontend-ui
description: |
  Implement UI components, pages, and frontend logic following project
  conventions. Use when creating or modifying components, pages, layouts,
  or UI-related code. Auto-loads when file paths match app/**, components/**,
  pages/**, src/components/**, src/pages/**, views/**, templates/**,
  or static/**. Framework-agnostic: works with React, Vue, Svelte, Solid,
  Angular, Astro, SvelteKit, Next.js, Nuxt, Remix, plain HTML/JS.
version: 1.0.0
---

# Frontend UI

## Overview

Build UI that is accessible, performant, and follows the project's
design system. Works with any frontend framework or plain HTML.

## Workflow

1. Read the spec or feature doc to understand the UI requirements.
2. Check for existing components in your design system before creating
   new ones. Reuse established primitives.
3. Implement the component/page following the project's conventions:
   - Server Components First (if your framework supports them)
   - Design system tokens for colors, spacing, typography
   - No inline magic numbers - use tokens or named constants
4. Ensure accessibility:
   - Single `<main>` per page
   - Skip link targets the main content
   - Color contrast >= 4.5:1 for normal text, >= 3:1 for large text
   - Accessible names include visible text
   - Descriptive link text (no "click here")
   - Keyboard navigable (tab order, focus indicators)
5. Ensure performance:
   - LCP element chosen on purpose
   - One `priority` image per route (if applicable)
   - Third-party scripts do not load on first paint
   - Static asset budgets respected
6. Write/update tests for the component
7. Update documentation if new component added to design system

## When to Load

Load this skill when:
- Creating new UI components or pages
- Modifying existing components
- The delegation matrix routes you here (Implement phase, UI paths)

## Consistency Checks

- Do not duplicate backend business logic in the frontend
- Use design system tokens, not hardcoded values
- Check existing components before creating new ones
- Responsive design: test mobile and desktop breakpoints
- Hydration errors: ensure server and client render the same output
  (for SSR frameworks)

## Output Expectations

Return:
- List of files created or modified
- Components reused vs newly created
- Accessibility checklist results
- Any performance concerns flagged
