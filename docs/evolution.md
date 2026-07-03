# Trellis Evolution Agent

> Parent: `docs/README.md`

Agents are not static. As a project grows, tools improve, the team learns, and
the AI landscape shifts, agent configurations must evolve. Stale agents are a
liability — they enforce yesterday's rules against today's code.

The Evolution Agent is Trellis's answer. It audits agent configurations against
current reality and proposes updates. It NEVER auto-applies changes — every
proposed change goes through SDD review (the framework reviews itself).

---

## What It Audits

The Evolution Agent runs 5 audit categories on a configurable schedule.

### 1. Stack Drift Detection

Has the project's actual stack drifted from what the constitution and mandate
files describe?

```
Constitution says: "Auth truth is Supabase Auth"
package.json shows: no @supabase/supabase-js dependency
                   + new dependency: @clerk/backend

→ Evolution Agent flags: "Clerk detected but constitution references
   Supabase. Proposed: update constitution Principle II to reflect Clerk."
```

Detection method: `scripts/evolve-detect-stack.mjs` reads package.json,
requirements.txt, go.mod, Cargo.toml and cross-references against the
constitution's stack-specific language.

### 2. Tool Version Staleness

Are commands or configs using deprecated flags, renamed packages, or
removed features?

```
AGENTS.md says: "npx fallow audit --changed-since HEAD"
Fallow v2.104 changelog: --changed-since renamed to --since HEAD

→ Evolution Agent flags: "Fallow flag renamed in v2.104. Proposed:
   update AGENTS.md command reference."
```

Detection method: `scripts/evolve-check-versions.mjs` reads installed
package versions and checks for known breaking changes from a changelog
registry.

### 3. Failure Pattern Analysis

Are agents repeatedly making mistakes that the current rules don't catch?

```
Phoenix traces show: 7 of 10 migration tasks had RLS errors caught
                     only at runtime, not during implementation.

→ Evolution Agent flags: "RLS errors cluster in implement phase.
   Proposed: add an implicit handoff trigger — migration file created
   triggers migration-validator BEFORE implementation completes."
```

Detection method: `scripts/evolve-analyze-failures.mjs` queries Phoenix
traces for recurring failure patterns and proposes rule/handoff additions.

### 4. Redundancy Detection

Are two agents or skills doing the same thing? Are mandate files bloated
with content duplicated elsewhere?

```
Both the api-routes skill and the security-review skill check rate
limiting.

→ Evolution Agent flags: "Rate-limit check duplicated across two
   specialists. Proposed: consolidate into security-review only."
```

Detection method: `scripts/evolve-detect-redundancy.mjs` analyzes skill
and handoff descriptions for overlapping responsibility.

### 5. Landscape Updates

Are there new open-source tools or patterns that would improve the framework?

This category is MANUAL — a human or agent runs it periodically. The
Evolution Agent provides the template:

```
scripts/evolve-landscape-checklist.md lists:
  - Check Graphify, Bounds, Fallow for major version bumps
  - Check for new AGENTS.md spec changes (AAIF)
  - Check for new StrykerJS / fast-check features
  - Check Ponytail for new modes
  - Check MCP server ecosystem for relevant additions
```

---

## How It Runs

The Evolution Agent is a Cron job + manual trigger. It does NOT run on every
PR (too slow). It runs on a schedule and produces a report.

### Schedule

| Audit               | Frequency           | How                              |
|---------------------|---------------------|----------------------------------|
| Stack drift         | Weekly              | `trellis evolve --stack`         |
| Tool version        | Bi-weekly           | `trellis evolve --versions`      |
| Failure patterns    | Weekly (if Phoenix) | `trellis evolve --failures`      |
| Redundancy          | Monthly             | `trellis evolve --redundancy`    |
| Landscape           | Quarterly (manual)  | `trellis evolve --landscape`     |
| Full audit          | Weekly              | `trellis evolve --all`           |

### Output Format

Every Evolution Agent run produces `.agents/evolution/YYYY-MM-DD-report.md`:

```markdown
# Evolution Report — 2026-07-10

## Stack Drift
- [PROPOSAL] Clerk detected; constitution references Supabase Auth
  Impact: HIGH | Confidence: HIGH
  Proposed change: Update constitution Principle II

## Tool Versions
- [PROPOSAL] Fallow v2.104 renamed --changed-since to --since
  Impact: MEDIUM | Confidence: HIGH
  Proposed change: Update AGENTS.md command reference

## Failure Patterns
- [PROPOSAL] RLS errors cluster in implement phase (7/10 migrations)
  Impact: HIGH | Confidence: MEDIUM
  Proposed change: Add implicit handoff trigger for migration-validator

## Redundancy
- OK — no duplicates found

## Landscape
- [INFO] StrykerJS v9 released with incremental mode improvements
  Impact: LOW | Confidence: HIGH
  Recommended action: upgrade in next maintenance window
```

### Decision Flow

```
Evolution Agent runs
       │
       ▼
Produces report (.agents/evolution/YYYY-MM-DD-report.md)
       │
       ▼
Human or orchestrator reviews report
       │
       ├── LOW impact + HIGH confidence → auto-apply via SDD mini-spec
       │
       ├── MEDIUM impact → create SDD spec for the change
       │
       └── HIGH impact → human review required before spec creation
       │
       ▼
SDD spec → Implement → Verify → Review
       │
       ▼
Change ships. Evolution log updated.
```

The key invariant: the Evolution Agent PROPOSES, it never DIRECTLY MODIFIES
framework files. Every change goes through the same SDD pipeline that every
other change goes through. The framework reviews itself.

---

## Configuration

`.agents/evolution/config.yaml`:

```yaml
schedule:
  stack_drift: weekly        # monday 09:00
  tool_versions: biweekly    # every other monday 09:00
  failure_patterns: weekly   # friday 17:00 (end of week analysis)
  redundancy: monthly        # 1st of month
  landscape: quarterly       # manual

thresholds:
  auto_apply:
    max_impact: low
    min_confidence: high
  spec_required:
    min_impact: medium

phoenix:
  enabled: false             # set true if Arize Phoenix is running
  url: http://localhost:6006
  failure_lookback_days: 7
```

---

## Why This Matters

Without an evolution mechanism, agent configurations drift into stale rules
that fight the codebase. A constitution that says "use Supabase Auth" in a
project that migrated to Clerk six months ago is worse than no constitution —
it actively misleads every agent that reads it.

The Evolution Agent makes the framework self-correcting. It is the immune
system against stagnation.

---

## Manual Trigger

```bash
# Run a full audit now
trellis evolve --all

# Run a specific audit
trellis evolve --stack
trellis evolve --versions
trellis evolve --failures    # requires Phoenix
trellis evolve --redundancy

# View the latest report
trellis evolve --latest
```
