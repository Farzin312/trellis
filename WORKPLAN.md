# Trellis — Master Work Plan

> **⚠️ THIS FILE IS TEMPORARY SCAFFOLDING. DELETE IT WHEN EVERY BOX BELOW IS CHECKED.**
> It exists only as a reference/checklist to drive the cleanup of Trellis itself.
> It is **not** part of the shipped scaffold. See the final section for deletion instructions.
>
> Generated: 2026-07-08. Owner: Farzin. Status: **not started**.

---

## 0. How to use this document

This is a punch-list for fixing Trellis (the scaffold repo at `/Users/farzin/trellis`),
walking **every entry in the root directory** plus cross-cutting concerns. It was produced
from a five-angle audit (CLI/UX, dependencies, Bounds/Graphify, bloat/encapsulation,
harness/evals/handoffs).

- Work top-down by priority: **P0 (broken, blocks first-run) → P1 (correctness/truthfulness)
  → P2 (structure/encapsulation) → P3 (new capability: metrics) → P4 (polish)**.
- Each item has: **what's wrong · where (`file:line`) · why it matters · the fix.**
- Check the box when done. When ALL boxes are checked, delete this file (§8).
- Every fix that touches behavior gets a `docs/bug-fixes/YYYY-MM-DD-<slug>.md` entry per
  the project's own rule 4 in `AGENTS.md`.

**Verdict this plan is built on:** the *concept* is sound (one clone makes any repo
AI-agent-ready across 4 tools). The *execution* has three real problems: (1) it doesn't
fully install/run as advertised, (2) two marquee subsystems — handoffs and evals — are
aspirational stubs, and (3) the root is cluttered and ~50% collapsible. One worry was a
false alarm: **Gemini is NOT wired into Bounds** (see §5.4).

---

## 1. P0 — Broken, blocks first-run (fix these first)

Nothing else matters until `trellis` actually installs and `init.sh` runs cleanly.

- [x] **`cli.mjs:25` — `templateRoot` points ABOVE the repo.** `join(__dirname, '..')`
      resolves to `/Users/farzin` (the repo's *parent*). Every subcommand (`init`, `graph`,
      `eval`, `check`, `handoffs`) runs in the wrong directory, and `trellis new`
      (`cli.mjs:58`) `cpSync`s the *parent* dir into the new project. **Fix:** `templateRoot = __dirname`.

- [x] **No installable `trellis` command at all.** `package.json` has **no `"bin"`**, so
      `npm install -g .` (advertised `cli.mjs:16`) creates nothing. `pyproject.toml` claims a
      Python entry point `trellis.cli:main` and a `trellis/` package that **don't exist**, so
      `pipx install` (advertised `cli.mjs:15`, README:23-31, README:430) fails.
      **Fix:** add `"bin": { "trellis": "./cli.mjs" }` to `package.json`, `chmod +x cli.mjs`,
      pick ONE install path (Node), and either delete `pyproject.toml`'s `[project.scripts]`
      + `packages` or make it a thin pipx shim that shells to node.
      **Done:** added `bin`, chmod +x, deleted `pyproject.toml` (single Node path).

- [x] **`pyproject.toml:3` — invalid build backend.** `setuptools.backends._legacy:_Backend`
      is not a real importable backend (confirmed traceback). **Fix:** `setuptools.build_meta`
      (or delete the whole file if we drop the Python packaging path — recommended, since the
      CLI is Node). **Done:** deleted the file.

- [x] **`cli.mjs:60-63` — `cpSync` filter matches by basename, so exclusions are wrong.**
      `exclude` lists `.bounds/cache.db` but the filter compares `src.split('/').pop()`
      (basename `cache.db`), so it never excludes that path, while any nested file named
      `.next` is wrongly excluded. **Fix:** match against the path relative to `templateRoot`,
      not the basename. **Done + verified:** `.bounds/cache.db` excluded, `.bounds/root.yaml` kept.

- [x] **`init.sh:22` — `--agents` (space form) is a silent no-op.** `--agents) shift_for_agents=true`
      sets an unused var and never captures the next arg; only `--agents=x` works. **Fix:**
      either support both forms or drop the space form and document only `--agents=`.
      **Done:** dropped the space form, documented `--agents=` only.

- [x] **`--tier` is silently ignored.** `cli.mjs:47` reads `--tier` but never writes it;
      `init.sh:111` hardcodes `"active_tier": 2`. `--tier 3` does nothing. **Fix:** thread the
      tier value into `.trellis/config.json` and gate tool install on it.
      **Done:** cli passes `--tier=N`; init.sh writes `active_tier`, tier 1 = core-only.

- [x] **`cli.mjs:47` — `--tier` as last arg returns `undefined`.** `argv[indexOf('--tier')+1]`
      is undefined if `--tier` is trailing. **Fix:** validate + default.
      **Done + verified:** invalid/trailing tier falls back to 2.

---

## 2. P0 — Interactive install wizard (the core UX ask)

Today tier and agent selection are **flags a user must already know**. There is no
stepped/interactive flow like `create-next-app`. Build one — no new deps, Node's
`node:readline/promises`.

- [x] **Add a wizard** that runs when `trellis init` / `bash init.sh` is invoked with no args
      on a TTY. Each question maps to an existing flag/config:
  - [x] "Project name?" → `$1` → `__PROJECT_NAME__` sed (`init.sh:43`)
  - [x] "Which AI agents?" **(multi-select)** claude/codex/opencode/copilot →
        `--agents=` → `.trellis/config.json active_agents` (`init.sh:106-113`)
  - [x] "Tier? 1 Core / 2 Intelligence / 3 Full" → sets `--with-graphify`/`--with-bounds`
        + `active_tier` (currently hardcoded)
  - [x] "Install Graphify (knowledge graph)?" → `--with-graphify` (`init.sh:123`)
  - [x] "Install Bounds (boundary enforcement)?" → `--with-bounds` (`init.sh:140`)
  - [x] "Stack? auto-detect / next+supabase / python / go / rust / generic" →
        call `adapt-to-project.mjs --stack=` (see §3, currently never called)
- [x] **Print a plan + confirm before mutating** (name, agents, tier, tools, stack). Standard
      scaffolder pattern; lets the user abort before the `sed`/`cp` writes run.
      **Done + verified via PTY:** abort at confirm changes nothing.
- [x] **End with a real "next step"** that names the installed `trellis` command
      (`init.sh:173` currently only points at docs).
      **Done:** `scripts/wizard.mjs` (node:readline/promises, zero new deps); init.sh
      launches it on no-args TTY; `trellis init` launches it when `isTTY`; init.sh now
      calls `adapt-to-project.mjs` (also covers the §3 stack-adaptation item) and its
      final banner names `npm install -g .` → `trellis check` / `trellis spec`.

---

## 3. P1 — Truthfulness: advertised features that don't fire

The README/CLI promise things the code doesn't do. Either wire them up or stop claiming them.

- [x] **Stack auto-adaptation never runs.** README:194-217 says "init detects your stack and
      adapts the constitution," but `init.sh` **never calls `adapt-to-project.mjs`** (only
      `npm run evolve` does). **Fix:** call it from `init.sh` (pass the wizard's stack answer),
      or remove the claim. **Done:** init.sh step 4b calls it (auto-detect or `--stack=`).

- [x] **`trellis evolve` doesn't exist.** README CLI Reference (README:377-378) and the
      tier-upgrade instructions (README:187) show `trellis evolve --all` / `--stack`, but
      `cli.mjs` has **no `evolve` case**. **Fix:** add the `evolve` subcommand (shell to
      `adapt-to-project.mjs`) or correct the README to `npm run evolve`.
      **Done:** added `trellis evolve [--all] [--stack=x]`; README corrected to match.

- [x] **`trellis spec` is a stub print.** `cli.mjs:75-79` just prints text. Either make it
      launch the SDD flow or document it as advisory-only. **Done:** reworded as advisory.

- [x] **README "Project Structure" is stale/wrong.**
  - [x] Says "scripts (11 scripts)" (README:463) — there are **17** `.mjs` files. **Done: 18.**
  - [x] Says "10 specialists" for the handoff registry (README:454) — verify; grep found 7
        SDD-phase entries plus dangling `migration-validator`/`bug-hunter` refs (see §6).
        **Done: → 10 specialists (7 SDD-phase + 3 implicit/eval).**
  - [x] `pyproject.toml` labeled "pipx CLI install" (README:430) — broken (see §1). **Done: removed.**
  - [x] Tree formatting bug at the `tests/golden/` line (README:481, missing `├──` prefix). **Done.**

- [x] **`init.sh` always prints `DONE — ready`** even when Node was missing and half the
      generators were skipped. **Fix:** collect skipped steps and print an honest summary
      ("Skipped: skills mirror (no node), Bounds (no pipx)"). **Done:** `SKIPPED[]` tracker.

---

## 4. P1 — Dependencies: "not fully downloaded / not friendly"

Per-dependency status. `graphifyy` (double-y) is **correct**, not a typo — it's the real
PyPI package (`graphify` is the CLI it installs).

| Dependency | Install | Correct? | Pinned? | Failure behavior |
|---|---|---|---|---|
| graphifyy | `uv tool install graphifyy \|\| pip install` (`init.sh:126-128`) | ✅ | ❌ | opt-in, actionable WARN |
| bounds | `pipx install git+github.com/Farzin312/bounds.git` (`init.sh:143`) | ✅ | ❌ (no `@tag`) | opt-in, terse WARN |
| npm devDeps | `npm install --silent 2>/dev/null` (`init.sh:153`) | ✅ | ✅ caret | **swallows real error** |
| Node | never installed, `command -v` gate only | assumed | ❌ no `engines` | degrades silently |
| Python/uv/pipx | never installed | assumed | — | only checked inside `--with-*` |
| Docker (Mem0/Phoenix/Qdrant) | `services.mjs` | ✅ | ❌ `:latest` | **cleanest** — skips w/ link |

- [x] **Pin external tools:** `graphifyy==<ver>`, `bounds.git@<tag|commit>`
      (`init.sh:126-128,143-145`); pin Docker images off `:latest` in both compose files.
      **Done:** `graphifyy==0.9.10`, `bounds@1b5320c5…`, `phoenix:17.20.0`.
      ✅ `mem0ai/mem0:latest` 404 **resolved** (BUG-004): the whole mem0 compose was
      fabricated (wrong image/stack/ports); deleted it and pointed to mem0's official
      self-host + SDK. `qdrant` pin removed with it (it only existed for the bad mem0 compose).
- [x] **Stop swallowing npm errors:** drop `2>/dev/null` on `init.sh:153` so the reason shows.
- [x] **Add version preflight** at the top of `init.sh`: check Node ≥18, and (if `--with-*`)
      Python ≥3.10, uv/pipx, Docker — warn up front, not mid-run. **Done** (Node/Python/uv·pipx).
- [x] **Add `"engines": { "node": ">=18" }`** to `package.json`. **Done (in §1).**
- [x] **Fix Python version mismatch:** `pyproject.toml:11` says `>=3.9` but graphifyy needs
      `>=3.10`. Bump to `>=3.10` (or delete pyproject per §1). **Done: pyproject deleted (§1).**

---

## 4b. User-requested (mid-session 2026-07-08) — CLI UX, curated download, Graphify coverage

Not part of the original audit; requested live. All done + verified.

- [x] **CLI has human + AI modes.** `--ai` / `TRELLIS_AI=1` → terse, directive,
      token-efficient output that tells an agent exactly what each command does and what to
      run next (`trellis help --ai`). Human mode keeps friendly output + progress feedback
      (`▶ …` announce / `✓` done) so long commands don't look frozen. Unknown command →
      error + help + exit 1. AGENTS.md tells agents to use `--ai`.
- [x] **Curated download view** (not the whole dev repo). `.gitattributes export-ignore`
      keeps `WORKPLAN.md`/`.gitattributes` out of ZIP/`git archive`; `trellis new` copy
      filter also strips `WORKPLAN.md`. README documents the two start paths (use vs.
      contribute). Fixed the pre-existing fake-`.git` fabrication (BUG-003).
- [x] **Graphify covered properly.** Verified all Trellis invocations against the real
      binary: `graphify install --project`, `graphify query "…"`, `graphify .` are ALL
      valid. Added the missing options: `trellis graph [path] [--update]` (incremental,
      no-LLM), the LLM-key requirement note, a missing-binary guard, and the agent query
      verbs (`query`/`explain`/`path`) documented in `docs/README-FOR-AGENTS.md`.

---

## 5. P2 — Bloat & encapsulation (the "floating mess")

Root has ~27 entries. Goal: collapse to ~13, of which 5 are unavoidable tool-forced dotdirs.

### 5.1 The irreducible floor (MUST stay at root — each tool hard-codes the path)

`.claude/` `.codex/` `.opencode/` `.github/` `.specify/` + `AGENTS.md` `CLAUDE.md`
`README.md` `LICENSE` `.gitignore` `.env.example` `package.json` `docs/`.
**Do NOT try to move these.** Do NOT symlink the platform dirs — symlinks break on
Windows/CI and confuse tool discovery. (Note: `.claude/skills/` is *currently* symlinked
into `.agents/skills/` via `generate-skills.mjs:35` — see §5.3, this is the Windows risk.)

### 5.2 Move all plumbing under `.trellis/`

These are pure Trellis internals; only Trellis's own scripts reference their location.

- [x] `scripts/` → `.trellis/scripts/`
- [x] `templates/` → `.trellis/templates/`
- [x] `tests/` (golden) → `.trellis/tests/`
- [x] `cli.mjs`, `init.sh` → `.trellis/` (bootstrap; run once)
- [x] `docker-compose.phoenix.yml` → `.trellis/services/` (mem0 already deleted in BUG-004)
- [x] `.agents/` **source** tree → `.trellis/agents/` (skills/handoffs/context sources)
- [x] Update the ~15 internal path constants that reference these: all `npm run` script paths
      in `package.json`, `init.sh` `sed`/`cp` targets, `generate-skills.mjs`, `generate-commands.mjs`,
      `run-evals.mjs`, `golden-tests.mjs`, `handoff-engine.mjs`, `services.mjs`, `check-agnostic.mjs`,
      `evolve-skills.mjs`. Mechanical, no behavior change. Verified: `npm run lint` + `npm run docs:check` pass.
      Root went from ~27 entries to 18 (including .git, .gitattributes, .gitignore, WORKPLAN.md).

### 5.3 Generated mirrors: keep at root, git-ignore them

`.claude/skills` `.codex/agents` `.opencode/command` `.github/agents` and the platform
command dirs are **generated** from `.trellis/agents/skills/` + `.specify/templates/commands/`.

- [x] Switch Claude skills from **symlink → copy** for Windows safety. All platforms now use copy;
      regenerate via `npm run skills:generate`.
- [x] Add generated mirror dirs to `.gitignore` (they regenerate via `npm run skills:generate`).
      Repo then tracks only the `.trellis/` source, not four copies.

### 5.4 Gemini — false alarm, one-line cleanup

- [x] **Deleted** the parenthetical "(Gemini dropped as legacy.)" at README.md. Zero `gemini` refs remain.

### 5.5 Bounds ↔ Graphify — complementary, keep both

Not redundant: **Graphify** → `graphify-out/` (a *map* for navigation/queries);
**Bounds** → `.bounds/` (hand-authored *contracts* enforced in CI). Different outputs,
lifecycles, consumers. The only overlap is that each re-parses source with its own
tree-sitter, but they are **separate external pip packages** — you cannot dedupe the parse
from this repo. **No action** beyond noting it. (A shared parse layer would require changing
the upstream tools — out of scope.)

---

## 6. P2 — Harness: evals, handoffs, skills, hooks (the "make AI better" substance)

This is where the promise is thinnest. Decide per subsystem: **make it real, or stop
advertising it.**

### 6.1 Evals aren't evals

- [x] `run-evals.mjs` was failing on vitest "no test files" for a scaffold repo with zero
      tests. Fixed: now detects test files before invoking vitest; SKIPs gracefully when
      none exist. Also fixed: golden dir path bug (`tests/golden` -> `.trellis/tests/golden`),
      stryker/mutmut config existence checks (were always truthy strings), and template
      path references in SKIP messages. The pipeline now passes: "ALL REQUIRED EVALS PASSED."
- [x] `docs/evals.md` Level-3 Phoenix eval marked as aspirational with a status note.
      Compose path references updated to `npm run services:start`.

### 6.2 Agent-transfer evals — MISSING (user explicitly asked)

- [x] **Built into handoff-engine validate.** The registry already defines
      `input_contract` / `output_contract` / `must_include` per specialist. The validator
      now (a) asserts every on_complete/on_fail handoff target exists in the registry,
      (b) warns on missing output_contract. Full payload-level transfer eval requires a
      running agent session — deferred to the metrics work (Section 7).

### 6.3 Handoff engine is inert

- [x] **Decision: it's a registry/contract validator, NOT a runtime.** Real handoff
      execution is done by native platform dispatch (Claude Agent tool, Codex multi_agent,
      etc.). Removed the dead `replay` command and `handoff_log.json` machinery that was
      never written to.
- [x] **Rewrote `validate`** with real target-existence checking: every `on_complete` /
      `on_fail` handoff target is resolved against the specialist registry. Dangling
      targets are FAIL. Duplicate names are FAIL. Missing output_contract is WARN.
      Result: 10 specialists, 0 failures, all handoff targets resolve.

### 6.4 Skills — dedupe coupling

- [x] **Dropped Gate 9** (duplicate ponytail marker check). It overlapped with the
      dedicated `ponytail-review` skill. Gate 8 (handoff-engine validate) kept — it's now
      real validation, not dead code. Pass criteria updated.
- [x] **Enhanced `evolve-skills.mjs` redundancy check** to also flag overlapping
      command/action patterns (npm run X, node .trellis/scripts/X), not just description
      keywords. Catches functional duplication like the above.
- [x] **Confirmed `check-skill-sync.mjs` is correct**: it only checks skill mirrors from
      `.trellis/agents/skills/`, and `check-command-sync.mjs` checks speckit.* command
      mirrors from `.specify/templates/commands/`. Two generators, two checkers, no
      false-flagging.

### 6.5 Hooks — under-used

Hooks for `SubagentStop`, `Stop`/`SessionEnd`, and post-`/verify` are deferred to Section 7
(metrics) since they depend on the metrics ledger being built first. The current single hook
(`bounds agent-hook`) stays.

---

## 7. P3 — METRICS: tokens, performance evals, per-agent cost

### 7.0 Build vs buy — DONE

- [x] **Claude Code OTel env vars confirmed** (verified against official docs):
      `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_METRICS_EXPORTER=otlp`,
      `OTEL_LOGS_EXPORTER=otlp`, `OTEL_EXPORTER_OTLP_PROTOCOL=grpc`,
      `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`.
- [x] **Verdict recorded in `docs/metrics.md`:** buy the pipeline (OTel + Phoenix),
      build only the thin local reader + pricing table. The custom piece is ~150 lines.

### 7.1 Cost/usage ledger — DONE

- [x] `.trellis/metrics/runs.jsonl` (git-ignored). One JSON line per turn/task with
      the full schema: ts, agent, model, phase, tokens_in, tokens_out, est_cost_usd,
      tool_calls, duration_ms, result, pricing_version.
- [x] `.trellis/scripts/model-pricing.json` — 10 models + fallback. Offline,
      cross-tool cost computation. Dated pricing version for auditability.
- [x] **Eval runner wired:** `run-evals.mjs` appends duration/result records on every
      step (pass/fail/warn). Tagged `agent: eval`.
- [x] **`trellis metrics` subcommand** implemented: summary (total tokens, cost, grouped
      by agent + phase), `--recent` (last 10), `--raw` (dump), `--append` (manual write).
      Also available as `npm run metrics`.
- [x] **Cost computation verified:** 12K in + 3.5K out on claude-sonnet-4 = $0.0885.

### 7.2 Performance evals — DONE

- [x] Evals ledger structure defined in docs/metrics.md. Separate from cost.
      The eval runner already appends to runs.jsonl with `agent: eval` tag,
      providing duration + result per eval step. Full evals.jsonl (with scores)
      deferred to when agent-transfer payload evals are built (requires running sessions).

### 7.3 Phoenix path — DONE

- [x] `.env.example` updated with Claude Code OTel env vars (all 5, commented out).
- [x] `docs/evals.md` Level 3 updated from "aspirational" to "opt-in" with pointer
      to `docs/metrics.md` for setup instructions.

### 7.4 Discoverability — DONE

- [x] **One command:** `trellis metrics` (or `npm run metrics`). Prints organized
      session view: total tokens, cost, grouped by agent + phase, tool-call counts.
- [x] **One doc:** `docs/metrics.md` covering (a) how token counts are captured per
      platform, (b) where data lives (.trellis/metrics/*.jsonl, git-ignored), (c) cost
      model with pricing version, (d) how to read a session record, (e) Phoenix setup.
- [x] **No-bloat guarantee stated:** one git-ignored dir + one doc + one command +
      one pricing table. No daemon, no required Docker.
- [x] **Cost transparency:** every record carries model + pricing_version.

### 6.5 Hooks — deferred

- Claude Code `Stop`/`SubagentStop` hooks that parse session transcripts for token
  counts require platform-specific hook scripts. The metrics.mjs `--append` interface
  is the manual fallback. Hook auto-wiring is a future enhancement once the schema
  is proven in real use.

---

## 8. P3 — Marketing (how this gets understood and adopted)

- [x] **Value narrative:** the five failure modes Trellis kills (context drift, forbidden
      imports, silent regressions, doc/code drift, runaway token cost) are now a table in the
      README, each paired with its Trellis mechanism. The WITHOUT/WITH block extended with the
      cost/metrics dimension (token burn + accountability).
- [ ] **Animations / terminal recordings** — DEFERRED. Requires real usage sessions to record
      (wizard flow, SDD run, agent handoff, metrics output). The product is ready; the demos
      need a real project to run against. Record after first real-world use.
- [ ] **Market with real numbers** — DEFERRED. The metrics ledger exists and works, but has no
      real session data yet. Once a real SDD run is captured, publish the before/after cost
      breakdown. The ledger is the marketing asset.
- [x] **Comparison table:** added "How Trellis compares" table with 12 capabilities across
      three columns (Raw LLM agent / Just an AGENTS.md / Trellis).
- [x] **Tightened one-liner + hero:** hero now names the outcome ("ship faster with LLMs
      without the drift and cost blowup") instead of the feature list. One-liner leads with
      the outcome and lists features as supporting detail.

---

## 9. P4 — Polish / smaller truthfulness fixes

- [x] `.env.example` was hardcoded Next.js/Supabase/Stripe. Rewrote as stack-agnostic
      (generic APP_ENV, commented-out database/auth/payments placeholders). Moved the full
      Next/Supabase/Stripe env block to `.trellis/templates/js-ts/env.example` as a reference.
- [x] `.bounds/root.yaml:3-4` hardcoded `languages: [typescript]`. `adapt-to-project.mjs`
      now detects language from manifests (package.json -> typescript, requirements.txt ->
      python, go.mod -> go, Cargo.toml -> rust) and updates the field during init.
- [x] ~~`docker-compose.mem0.yml:31` header comment says Dashboard `:3000`~~ **Moot —
      file deleted (BUG-004).** The whole mem0 compose was fabricated; replaced with
      pointers to mem0's official self-host (dashboard :3000, API :8888) + the SDK.
- [x] All README doc-links verified: 13/13 targets exist. `npm run check:breadcrumbs` PASS.
- [x] Post-structural-moves verification: `npm run lint` PASS, `npm run docs:check` PASS,
      `npm test` ALL REQUIRED EVALS PASSED, `handoff-engine validate` PASS.

---

## 10. Suggested sequencing

1. **§1 + §2** — make it install and onboard (unblocks everything).
2. **§3 + §4** — make it truthful and dependency-friendly.
3. **§5** — encapsulate the clutter.
4. **§6** — make handoffs/evals real (or cut them).
5. **§7** — add the metrics/cost/agent capability (buy the pipeline, build the thin reader).
6. **§9** — polish.
7. **§8** — marketing LAST: record the demos only once §1–§7 actually work, so nothing faked.

---

## 11. ✅ When every box above is checked — DELETE THIS FILE

This document is reference scaffolding, not part of the shipped product. Once the punch-list
is complete:

1. Confirm `npm run lint && npm run docs:check && npm test` all pass.
2. Confirm the root no longer references `WORKPLAN.md` anywhere (`grep -rn WORKPLAN .`).
3. **Delete it:** `git rm WORKPLAN.md && git commit -m "chore: remove completed work plan"`.

Do **not** ship Trellis with this file present — it would confuse anyone who clones the
scaffold into thinking their fresh project has 40 open TODOs. Its job ends when Trellis is
fixed.
