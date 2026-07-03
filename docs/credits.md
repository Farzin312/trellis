# Credits & Acknowledgments

Trellis builds on the work of many open-source projects. This file credits
every tool we use, reference, or recommend — even where we adapted or modified
them for this framework.

---

## Core Tools (Integrated)

### Graphify — Knowledge Graph
- Repo: https://github.com/safishamsi/graphify
- License: MIT
- Stars: 76.9K
- PyPI: `graphifyy` (CLI command is `graphify`)
- Author: Safi Shamsi
- What it does: Turns code, SQL schemas, docs, PDFs, and images into a
  queryable knowledge graph. Always-on PreToolUse hooks nudge agents to query
  the graph before reading source files. Confidence tags (EXTRACTED / INFERRED
  / AMBIGUOUS). PostgreSQL live introspection.
- How Trellis uses it: Tier 2+ always-on knowledge graph. Trellis ships
  install commands and a freshness CI gate; no modifications to Graphify itself.

### Bounds — Boundary Enforcement
- Repo: https://github.com/Farzin312/bounds
- License: MIT
- Author: Farzin
- What it does: Subsystem boundary enforcement via tree-sitter manifests.
  Prescriptive architectural rules enforced at CI. Commands: list, describe,
  where, impact, validate, calibrate.
- How Trellis uses it: Tier 2+ boundary enforcement, SDD-integrated.
  Note: Bounds is a new project (created 2026-05-29). It is the right tool for
  AI-agent-ready boundary enforcement — no competitor does exactly this.
  dependency-cruiser (Apache-2.0, 6.8K stars) is complementary for import-rule
  enforcement at the file level if needed.

### Fallow — Codebase Intelligence
- Repo: https://github.com/fallow-rs/fallow
- License: MIT (static analysis layer); proprietary (runtime layer)
- Stars: 4.0K
- What it does: Dead code, duplication, circular deps, complexity hotspots,
  architecture boundary violations. 123 framework plugins. Sub-second.
- How Trellis uses it: Free static layer only (fully sufficient). Trellis
  documents Fallow's audit command in the review phase. The optional paid
  runtime layer (production traffic evidence) is NOT required.

### StrykerJS — Mutation Testing
- Repo: https://github.com/stryker-mutator/stryker-js
- License: Apache-2.0
- Stars: 2.9K
- Author: Stryker Mutator team
- What it does: Injects artificial bugs into code and checks if tests catch
  them. The single most important eval for AI-heavy codebases.
- How Trellis uses it: Tier 2+ mutation testing eval. CI gate with configurable
  threshold. Trellis ships a stryker.config.json tuned for incremental mode.

### fast-check — Property-Based Testing
- Repo: https://github.com/dubzzz/fast-check
- License: MIT
- Stars: 5.0K
- Author: Nicolas Dubien
- What it does: Define invariants, auto-generates hundreds of edge-case tests.
  The de facto property-based testing library for JS/TS.
- How Trellis uses it: Integrated into the Vitest test suite via
  @fast-check/vitest.

### Arize Phoenix — Agent Observability
- Repo: https://github.com/Arize-ai/phoenix
- License: Elastic License 2.0 (ELv2)
- Stars: 10.4K
- Author: Arize AI
- What it does: Traces every agent turn — token cost, tool calls, failures,
  time per task. LLM-as-judge evaluations. Prompt playground. Self-hosted.
- LICENSE NOTE: ELv2 is source-available and free to self-host with ALL
  features included (unlike Langfuse which gates LLM-as-judge behind paid tier).
  It is NOT OSI-certified open source. Key restrictions: you cannot offer it
  as a hosted service to third parties, and you cannot circumvent license key
  functionality. For internal use (which is the Trellis use case), it is fully
  free. If your project requires strict OSI-only licenses, replace with
  Langfuse (MIT core, but fewer free features).

### Zod — Schema Validation
- Repo: https://github.com/colinhacks/zod
- License: MIT
- Stars: 43.1K
- Author: Colin Hacks
- What it does: TypeScript-first schema validation. Industry standard.
- How Trellis uses it: Tier 3 type-safe API contracts.

### tRPC — End-to-End Type-Safe APIs
- Repo: https://github.com/trpc/trpc
- License: MIT
- Stars: 40.4K
- What it does: Backend function signatures imported directly into frontend.
  Zero schema duplication.
- How Trellis uses it: Tier 3. Note: with Next.js App Router, Server Components
  use a "server caller" directly. Document this pattern when adapting.

### Biome — Fast Linter/Formatter
- Repo: https://github.com/biomejs/biome
- License: Apache-2.0
- Stars: 25.2K
- What it does: All-in-one ESLint + Prettier replacement. 10-20x faster.
- How Trellis uses it: Optional ESLint replacement for speed. Known limitation:
  narrower plugin ecosystem than ESLint. Sufficient as default; users with
  niche needs can add ESLint rules alongside.

### Ponytail — Lazy Senior Dev Mode
- Repo: https://github.com/DietrichGebert/ponytail
- License: MIT
- Stars: 72.8K
- Author: Dietrich Gebert
- What it does: Prevents over-engineering. Stdlib first, one line over fifty.
- How Trellis uses it: Installed as a plugin per agent platform (never inlined
  into AGENTS.md). Trellis treats Ponytail as advisory (default posture), not a
  hard gate. Trellis's check-ponytail.mjs is inspired by Ponytail's marker
  convention but is independent code.

---

## Standards & Protocols

### AGENTS.md
- Steward: Agentic AI Foundation (AAIF) under the Linux Foundation
- Status: De facto cross-tool standard (60K+ repos, 30+ agents)
- Trellis uses AGENTS.md as the primary mandate file, byte-synced to CLAUDE.md.

### Anthropic Agent Skills (SKILL.md)
- Spec: https://agentskills.io/specification
- Steward: Anthropic (open, Apache-2.0 for published skills)
- Trellis uses the SKILL.md format for all project-local skills.

### GitHub Spec Kit (Spec-Driven Development)
- Repo: https://github.com/github/spec-kit
- License: MIT
- Stars: 118K
- Trellis's SDD pipeline is inspired by and compatible with Spec Kit's
  Specify -> Clarify -> Plan -> Tasks -> Analyze -> Implement -> Verify flow.
  Trellis ships its own command sources but follows the same phase structure.

---

## Additional Tools (Mentioned / Compatible)

### Zoekt — Code Search
- Repo: https://github.com/sourcegraph/zoekt
- License: Apache-2.0
- Stars: 1.7K
- Fast trigram-based indexed code search. Pair with ripgrep for local search.

### MCP Servers
- Repo: https://github.com/modelcontextprotocol/servers
- The official reference collection. Trellis recommends the filesystem, GitHub,
  and Postgres/Supabase servers for agent tool connectivity.

### Ollama — Local Model Runner
- Repo: https://github.com/ollama/ollama
- License: MIT
- Stars: 175K
- NOTE: Graphify uses Claude for its LLM extraction, NOT Ollama. Ollama is
  listed here as an optional tool for fully local LLM workflows.

### Mem0 — Agent Memory (Optional Upgrade)
- Repo: https://github.com/mem0ai/mem0
- License: Apache-2.0
- Stars: 60K
- Self-hostable: YES — `cd server && docker compose up -d` gives a full
  dashboard with auth and API keys. Also available in library mode
  (`pip install mem0ai`, in-process, no server).
- What it does: Universal memory layer for AI agents. Semantic search,
  entity linking, temporal reasoning, multi-signal retrieval (semantic +
  BM25 + entity). Scores 91.6 on LoCoMo benchmark.
- How Trellis relates: Trellis ships .agents/context/ (JSON files) as the
  zero-dependency default. Mem0 is the upgrade path for teams needing
  semantic memory search or shared dashboards. Mem0 requires an LLM at
  runtime (default gpt-5-mini, supports Ollama for fully local).
- Ships as: Agent Skill (SKILL.md format). Install: `npx skills add mem0ai/mem0`

---

## Inspired By

The documentation structure rules (parent-child breadcrumb pattern, 14-section
subsystem template, doc-code accuracy pipeline, bug-fix categorization), the
SDD pipeline with cross-tool command mirroring, and the concept of doc-drift
detection on every read were all refined through extensive production use across
multiple fullstack projects.

We stand on the shoulders of everyone who has worked on making AI coding
agents more effective, safer, and more maintainable.

---

## Trellis's Own License

Trellis is MIT licensed. Use it, fork it, modify it, sell it. No attribution
required (but appreciated). See [LICENSE](../LICENSE).
