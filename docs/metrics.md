# Metrics Ledger

> Parent: [documentation index](./README.md)

Trellis can validate and summarize an optional local JSONL ledger at
`.trellis/metrics/runs.jsonl`. It does not collect agent telemetry, infer token
usage, or compute a missing cost. Usage and cost values must be provider-supplied
or written by another project-owned integration.

## Commands

```bash
trellis metrics           # validated aggregate summary
trellis metrics --recent  # validated recent records
trellis metrics --raw     # validated JSONL output
```

Every nonblank line is parsed and validated before any summary is printed. A
malformed record exits non-zero and identifies its line.

## Accepted record

Each line is one JSON object. These string fields are optional:

- `ts`
- `agent`
- `model`
- `phase`
- `phase_or_task`
- `result`
- `pricing_version`

These numeric fields are optional, finite, and nonnegative:

- `tokens_in` and `tokens_out` — integers
- `est_cost_usd` — provider-supplied decimal value
- `tool_calls` and `duration_ms` — integers

Unknown, negative, non-finite, or structurally invalid values fail validation.
Missing values remain missing; Trellis does not synthesize them from a pricing
table.

Example:

```json
{"ts":"2026-07-10T15:00:00Z","agent":"codex","model":"provider-model","phase":"verify","tokens_in":1200,"tokens_out":300,"est_cost_usd":0.01,"duration_ms":2400,"result":"pass"}
```

The eval runner reports its own check counts and duration but does not append
agent usage or cost records. Connect a provider export explicitly if your team
needs those fields.
