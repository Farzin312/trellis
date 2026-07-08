# Portable Context System

Git-trackable, cross-agent context persistence. Any AI agent reads and writes
these files via instructions in AGENTS.md. No external service, no proprietary
format, no lock-in.

## How It Works

Agents persist state across sessions using plain JSON files in this directory.
The mandate file (AGENTS.md) instructs every agent to read on startup and
write on changes. This works with Claude Code, Codex, OpenCode, Copilot, or any
agent that can read files.

```
.agents/context/
├── session.json      — current task state (active spec, phase, task IDs)
├── decisions.json    — architectural decisions made during this work
├── learnings.json    — discoveries about the codebase (gotchas, patterns)
└── handoff_log.json  — record of agent-to-agent handoffs (replay/debugging)
```

Files are created on first use. They start empty.

## Lifecycle

1. **Session start**: agent reads `session.json` to resume where the last session left off.
2. **During work**: agent appends decisions to `decisions.json` and discoveries to `learnings.json`.
3. **On handoff**: the handoff engine writes to `handoff_log.json`.
4. **Session end**: agent updates `session.json` for the next session.

## Git Tracking

These files are git-tracked by default. Context travels with the branch.

When a feature branch merges:
- `session.json` resets (the feature is done)
- `decisions.json` and `learnings.json` persist as institutional memory

If a context file contains secrets or sensitive debugging info, add it to
`.gitignore` manually.
