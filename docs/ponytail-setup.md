# Ponytail Setup

> Parent: `docs/README.md`

Ponytail is a lazy-senior-dev plugin by Dietrich Gebert. It prevents over-engineering by defaulting to the simplest solution that works: stdlib first, one line over fifty, no unrequested abstractions.

## Important: Ponytail is advisory

Ponytail is a DEFAULT POSTURE, not a hard gate. The lazy solution is the starting point — but it is not always correct. Stdlib has bugs, one-liners hide edge cases, and some abstractions are genuinely needed.

When you deliberately go beyond lazy, mark it:
```
# trellis: full-impl, <reason>
```

When you simplify, mark it:
```
# ponytail: <ceiling>, upgrade: <path>
```

The CI check (check-ponytail.mjs) validates marker FORMAT only. It does not block builds.

## Install

Ponytail repo: https://github.com/DietrichGebert/ponytail

All commands are non-interactive and can be run from any directory.

### Claude Code

```bash
claude plugin marketplace add DietrichGebert/ponytail
claude plugin install ponytail@ponytail
```

Hooks auto-inject the ruleset at SessionStart.

### Codex CLI

```bash
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```

Note: Codex uses `plugin add`, not `plugin install`.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add DietrichGebert/ponytail
copilot plugin install ponytail@ponytail
```

### OpenCode

OpenCode does not have a native plugin marketplace. Copy the standalone ruleset from the Ponytail repo into `.opencode/rules/ponytail.md` (a small standalone file — do NOT append to AGENTS.md).

## Default Mode

Default is `full`. Change globally:

- Env: `export PONYTAIL_DEFAULT_MODE=ultra` (off|lite|full|ultra)
- Config: `~/.config/ponytail/config.json` with `{"defaultMode": "lite"}`

## Verification

```bash
claude plugin list 2>&1 | grep ponytail
codex plugin list 2>&1 | grep ponytail
copilot plugin list 2>&1 | grep ponytail
```

## What NOT to do

Do NOT paste the Ponytail ruleset into:
- AGENTS.md (bloats docs, hooks inject it anyway)
- CLAUDE.md (same problem, double-reads)
- .github/copilot-instructions.md (not needed when plugin installed)

The hooks handle auto-injection. If an agent doesn't support plugins, use their native rule-file mechanism as a small standalone file.

## Credit

Ponytail is created and maintained by [Dietrich Gebert](https://github.com/DietrichGebert). Licensed under MIT. Trellis uses it as a recommended (not required) plugin and documents the install commands. Trellis's own check-ponytail.mjs is inspired by Ponytail's marker convention but is independent code.
