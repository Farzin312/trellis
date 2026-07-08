# Trellis Metrics

> Parent: `docs/README.md`

Token cost, usage, and per-agent performance tracking. Zero-dep, no-Docker,
cross-tool. This is the "how much did it cost and which agent did it" answer.

---

## Build vs Buy (the verdict)

**Do not build a metrics engine.** The industry standard is OpenTelemetry GenAI
semantic conventions. Trellis uses it as the wire format.

- **Claude Code exports telemetry natively.** No custom code needed for the
  Claude platform:
  ```bash
  export CLAUDE_CODE_ENABLE_TELEMETRY=1
  export OTEL_METRICS_EXPORTER=otlp
  export OTEL_LOGS_EXPORTER=otlp
  export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
  export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
  ```
  This emits token counts, cost, and model/session metadata over OpenTelemetry.

- **Dashboards already exist and self-host for free.** Arize Phoenix (already
  in this repo) and Langfuse (open-source; ships per-model cost maps, session
  views, dashboards out of the box) both receive Claude's OTel export.

- **What Trellis actually builds is small** — the only gap none of the above
  fills is a zero-dep, no-Docker, cross-tool, offline view. Codex/OpenCode/
  Copilot don't all export cleanly, and Phoenix/Langfuse need a running
  collector. So the custom piece is just the thin `runs.jsonl` ledger +
  `model-pricing.json` + a `trellis metrics` reader (~150 lines), NOT a
  platform.

**Verdict:** buy the pipeline (OTel + Phoenix/Langfuse), build only the thin
local reader + pricing table.

---

## Where data lives

```
.trellis/metrics/
├── runs.jsonl          # cost/usage ledger (one JSON line per turn/task)
├── evals.jsonl         # quality eval results (separate from cost)
└── (git-ignored — never touches the user's source tree)
```

`.trellis/scripts/model-pricing.json` — pricing table (tracked in repo, updated
by humans).

---

## Cost model

`model-pricing.json` maps model names to per-million-token rates:

```json
{
  "claude-sonnet-4": { "input_per_mtok": 3.0, "output_per_mtok": 15.0 },
  "gpt-4o": { "input_per_mtok": 2.5, "output_per_mtok": 10.0 }
}
```

Every `est_cost_usd` in `runs.jsonl` carries the `model` name and the
`pricing_version` (date from `model-pricing.json`) it was computed against,
so the number is auditable.

**To update prices:** edit `.trellis/scripts/model-pricing.json`, update the
`_updated` field. Old ledger entries keep their original pricing version.

---

## How to read a session record

One line in `runs.jsonl`:
```json
{"ts":"2026-07-08T14:23:00Z","agent":"claude","model":"claude-sonnet-4","phase":"implement","tokens_in":12000,"tokens_out":3500,"est_cost_usd":0.0855,"tool_calls":12,"duration_ms":45000,"result":"pass","pricing_version":"2026-07-01"}
```

Fields:
- `ts` — ISO timestamp
- `agent` — which platform (claude, codex, opencode, copilot, eval)
- `model` — model name (must exist in model-pricing.json for cost calc)
- `phase` — SDD phase or task label
- `tokens_in` / `tokens_out` — prompt + completion tokens
- `est_cost_usd` — computed offline from model-pricing.json
- `tool_calls` — number of tool invocations
- `duration_ms` — wall-clock time
- `result` — pass, fail, or descriptive label
- `pricing_version` — date from model-pricing.json when cost was computed

---

## The command

```bash
trellis metrics           # summary: total tokens, cost, grouped by agent + phase
trellis metrics --recent  # last 10 sessions
trellis metrics --raw     # dump runs.jsonl as-is
```

---

## No-bloat guarantee

The entire metrics feature is: one git-ignored dir + one doc + one command +
one pricing table. Nothing is added to the user's app code, no always-on
daemon, no required Docker. Opt into Phoenix only at Tier 3.

---

## How to switch on Phoenix (Tier 3)

1. Start Phoenix: `npm run services:start`
2. Set env vars:
   ```bash
   export CLAUDE_CODE_ENABLE_TELEMETRY=1
   export OTEL_METRICS_EXPORTER=otlp
   export OTEL_LOGS_EXPORTER=otlp
   export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
   export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
   ```
3. Phoenix dashboard: http://localhost:6006

Until Phoenix is configured, the JSONL ledger is the source of truth.

---

## Feeding the ledger

| Source | How | Fields populated |
|--------|-----|------------------|
| Claude Code | `Stop`/`SubagentStop` hook parses session transcript | all fields |
| Eval runner | `run-evals.mjs` appends on each step | duration, result, agent=eval |
| Other platforms | Best-effort append | duration, result (tokens if available) |

Manual append is also supported — any tool can write a line to `runs.jsonl`
as long as it follows the schema above.
