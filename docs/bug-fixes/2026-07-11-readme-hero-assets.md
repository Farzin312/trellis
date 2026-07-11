---
id: BUG-011
title: README hero rendered a broken GIF and shipped unused raster assets
date_fixed: 2026-07-11
severity: low
status: fixed
area: docs
subsystem: readme-assets
category: ui-display
files:
  - README.md
  - assets/readme/setup-demo.svg
  - docs/credits.md
fixed_by: Claude Opus 4.8
---

# Bug Fix

> Parent: [`docs/bug-fixes/README.md`](README.md)

## Summary

The README hero defaulted to `assets/readme/setup-demo.gif` (an 11 KB animation
whose body rendered nearly empty) with a redundant raster `setup-demo.png`
reduced-motion fallback. A crisp, project-authored `setup-demo.svg` already
existed but was never referenced. A 254 KB `assets/brand/trellis-mark.png` was
packaged but referenced nowhere.

## Root cause

Asset selection, not code: the `<picture>` block pointed at raster sources while
the equivalent vector asset sat unused, and the brand mark PNG was an orphan
carried in `package.json` files and the asset test list.

## Fix

Promoted `setup-demo.svg` to the hero as a single `<img>` and added a CSS-only
staggered reveal. The animation is enhancement-only: base opacity is 1 with the
hidden start confined to the keyframe via `backwards` fill, so any renderer that
drops the animation still shows the complete static frame, and a
`prefers-reduced-motion` query disables motion. Deleted `setup-demo.gif`,
`setup-demo.png`, and `trellis-mark.png`, and removed them from `package.json`,
`release.test.mjs`, and `public-docs.test.mjs`.

## Prevention

`public-docs.test.mjs` now asserts the reduced-motion query lives in
`setup-demo.svg` and keeps the `<script|animate|set>` ban, so the walkthrough
stays declarative and accessible. `rsvg-convert` (which applies CSS but never
runs animations) renders the full static frame, matching the sanitizer-stripped
degrade path.

## References

- Spec: N/A
- Related bugs: N/A
