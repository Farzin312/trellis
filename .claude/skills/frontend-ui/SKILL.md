---
name: frontend-ui
description: Implement or review user interfaces, components, pages, layouts, interaction state, and frontend data flow. Use when a change affects rendered UI, accessibility, responsiveness, loading or error states, design-system usage, or client-side behavior.
---

# Frontend UI

1. Read the user outcome and inspect existing design-system primitives before
   creating components or tokens.
2. Model loading, empty, success, partial, error, disabled, and retry states that
   can occur. Keep displayed state consistent with server truth.
3. Follow the framework's established rendering and data-fetching conventions;
   do not impose a framework-specific default.
4. Use semantic structure, visible focus, keyboard operation, accessible names,
   useful errors, and project-approved contrast. Respect reduced motion.
5. Design for supported viewport sizes, zoom, long content, localization, slow
   networks, and repeated actions.
6. Reuse tokens and primitives. Add an abstraction only when it has a real shared
   contract, not merely similar markup.
7. Test behavior at the appropriate layer and visually verify meaningful states
   when a runnable interface exists.

Do not duplicate authorization or business rules in the client. Client checks
improve UX; the trusted server boundary still enforces them.

Return changed paths, reused and new primitives, states covered, accessibility
evidence, visual evidence when available, and remaining limitations.
