# Bug Fix

> Parent: [`docs/bug-fixes/README.md`](README.md)
---
id: BUG-004
title: Mem0 self-hosting was fabricated (404 image, wrong stack) — pointed upstream
date_fixed: 2026-07-08
severity: high
status: fixed
area: services
subsystem: self-hosted
category: env-config
files:
  - docker-compose.mem0.yml
  - scripts/services.mjs
  - docs/self-hosted-services.md
  - docs/credits.md
  - .env.example
  - README.md
  - AGENTS.md
fixed_by: Claude (user-requested)
---

## Summary

Trellis shipped `docker-compose.mem0.yml` as a "self-hosted Mem0" service. It could
never start: the image did not exist, the architecture was wrong, and required
config was missing. The docs advertised `docker compose -f docker-compose.mem0.yml
up -d` as working.

## Root cause

The compose was fabricated, not derived from mem0's real stack:
- **Image** `mem0ai/mem0:latest` is a **Docker Hub 404** (the `mem0ai` namespace
  publishes no images). The real server image is `mem0/mem0-api-server` (only a
  `:latest` tag — unpinnable).
- **Vector store**: Trellis bundled **Qdrant**; mem0's server requires
  **Postgres/pgvector** (`pgvector/pgvector:pg17`).
- **Ports**: compose assumed the API on `3000`; the API is `8000` (mapped `8888`),
  and `3000` is a separate Next.js dashboard that only builds from source.
- **Missing required env**: `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_API_KEY`.

Mem0's official self-host is a multi-service build-from-source stack
(`cd server && make bootstrap`), so a faithful standalone Trellis compose is not
possible without vendoring mem0's evolving source.

## Fix

Stopped shipping a bespoke compose and pointed at reality (verified against the
live registries and mem0's repo):
- Deleted `docker-compose.mem0.yml`; removed mem0 from `scripts/services.mjs`
  (Phoenix stays the only vendored service).
- Rewrote `docs/self-hosted-services.md`: lead with the in-process SDK
  (`pip install mem0ai`, verified on PyPI), and for the server point to mem0's
  official `git clone && cd server && make bootstrap` (dashboard :3000, API :8888).
- Fixed `.env.example`, `docs/credits.md`, README structure tree, and the
  AGENTS.md/CLAUDE.md services line accordingly. `@mem0/cli` (npm) confirmed to exist.

## Prevention

Nothing is claimed that isn't verifiable: package names checked against PyPI/npm,
image names against Docker Hub, ports/config against mem0's `server/.env.example`.
Trellis owns only what it can maintain (the SDK/CLI/skill pointers), not a copy of
someone else's multi-service stack.

## References

- Related bugs: BUG-002 (surfaced the 404)
- Upstream: https://github.com/mem0ai/mem0 (`server/`)
