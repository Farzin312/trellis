# JS/TS Template

Copied to project root when init.sh detects Node.js (package.json present).

## Files

- `vitest.config.ts` — test runner with 80% coverage thresholds
- `stryker.config.json` — mutation testing config (break threshold: 50)

## After Copy

init.sh also adds these to package.json scripts (if not present):
- `"test": "vitest run"`
- `"test:mutation": "stryker run"`
- `"eval": "node .trellis/scripts/run-evals.mjs"`

## Alternatives if Not Using Vitest

- **Jest**: swap vitest.config.ts for jest.config.js. Change stryker testRunner to "jest".
- **node --test**: native Node test runner (no config file needed). Stryker supports it via `testRunner: "command"`.
- **Biome**: does not replace a test runner, but replaces ESLint + Prettier for lint/format.

## fast-check Integration

fast-check integrates into Vitest via `@fast-check/vitest`. Install:
`npm install --save-dev fast-check @fast-check/vitest`
