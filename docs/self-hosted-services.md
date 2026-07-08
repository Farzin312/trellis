# Self-Hosted Services Setup

> Parent: `docs/README.md`

Trellis ships two optional self-hosted services. Both are free and open-source.
Neither is required for the framework to function — they enhance specific
capabilities.

| Service | Purpose | When to add | License | Port |
|---------|---------|-------------|---------|------|
| Arize Phoenix | Agent observability (traces, token cost, failures) | Tier 3 | ELv2 (free self-host) | 6006 |
| Mem0 | Semantic agent memory (search, entity linking) | Optional upgrade | Apache-2.0 | upstream (SDK, or server on 3000/8888) |

Phoenix is the only service Trellis ships as a Docker Compose file. **Mem0 is not
vendored** — it self-hosts from its own stack (see the Mem0 section below).

---

## Prerequisites (both services)

### 1. Docker

Both services run as Docker containers. Install Docker Desktop (macOS/Windows)
or Docker Engine (Linux).

**macOS:** Download Docker Desktop from https://docker.com — Apple Silicon
and Intel both supported.

**Windows:** Download Docker Desktop. Enable WSL2 backend.

**Linux (Debian/Ubuntu):**
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

**Verify Docker is installed and running:**
```bash
docker --version
docker compose version
docker info
```
All three must succeed. If `docker info` fails, the Docker daemon is not running.

### 2. For Mem0: an LLM provider

Mem0 requires an LLM at runtime to extract and link memories. Choose one:

| Provider | Setup | Cost | Recommended for |
|----------|-------|------|-----------------|
| Ollama | Install from https://ollama.com, then `ollama pull llama3.1` | Free, fully local | Privacy-sensitive, offline |
| OpenAI | Set `OPENAI_API_KEY` in `.env.local` | Pay per token | Easiest, best quality |
| Anthropic | Set `ANTHROPIC_API_KEY` in `.env.local` | Pay per token | Claude-quality extraction |

For fully local (no external API calls): use Ollama for both the LLM and
embeddings (`ollama pull nomic-embed-text`) via the SDK's config. Mem0's bundled
**server** ships OpenAI/Anthropic/Google providers (see its `server/.env.example`).

---

## Arize Phoenix (Agent Observability)

**What:** Traces every AI agent turn — token cost, tool calls, failures, time
per task. LLM-as-judge evaluations. Prompt playground.

**License:** Elastic License 2.0 (ELv2). Free to self-host with all features.
NOT OSI-certified. See [docs/credits.md](credits.md) for details.

**Start:**
```bash
docker compose -f docker-compose.phoenix.yml up -d
```

**Dashboard:** http://localhost:6006

**Stop:**
```bash
docker compose -f docker-compose.phoenix.yml down
```

**Reset all data:**
```bash
docker compose -f docker-compose.phoenix.yml down -v
```

**Instrument your code:** See https://docs.arize.com/phoenix for SDK
integration guides (Python, TypeScript, OpenTelemetry).

---

## Mem0 (Agent Memory Upgrade)

**What:** Universal memory layer. Semantic search across decisions and
learnings. Entity linking. Temporal reasoning. Shared web dashboard.

**License:** Apache-2.0. Fully free to self-host.

**Default in Trellis:** Trellis ships `.trellis/agents/context/` (plain JSON files) as
the zero-dependency default. Mem0 is the upgrade when you need capabilities
JSON files cannot provide.

### When to upgrade to Mem0

| Need | Use .trellis/agents/context/ | Use Mem0 |
|------|---------------------|----------|
| Save decisions and learnings | Yes | Yes |
| Resume where last session left off | Yes | Yes |
| Search by keyword | Yes (grep) | Yes (semantic) |
| "Find decisions about auth from last month" | No | Yes |
| Entity graphs across memories | No | Yes |
| Shared team dashboard | No | Yes |
| Zero dependencies | Yes | No (needs LLM) |

### Three modes

Trellis does not vendor a Mem0 compose file — Mem0's server is a multi-service,
build-from-source stack (FastAPI + Postgres/pgvector + Next.js dashboard) that
mem0 maintains upstream. Use one of mem0's own supported paths:

**1. Library mode (no server, in-process) — simplest, recommended start:**
```bash
pip install mem0ai        # PyPI package: mem0ai
```
Uses an LLM in-process. Good for prototypes and single-user. No Docker, no dashboard.
Set an LLM key (e.g. `OPENAI_API_KEY`) so it can extract and link memories.

**2. Self-hosted server (teams — dashboard + API keys):** run mem0's official
stack, not a Trellis copy:
```bash
git clone https://github.com/mem0ai/mem0.git
cd mem0/server
cp .env.example .env        # set POSTGRES_PASSWORD and OPENAI_API_KEY (required)
make bootstrap              # builds + starts API + Postgres + dashboard, prints admin creds
```
- Dashboard: http://localhost:3000
- API + OpenAPI docs: http://localhost:8888  (`/docs`)

Save the admin password and first API key printed in the `=== Ready ===` block —
the API key cannot be recovered afterward.

**3. CLI (from terminal):**
```bash
npm install -g @mem0/cli   # npm package: @mem0/cli
mem0 init
mem0 add "Prefers dark mode and vim keybindings" --user-id alice
mem0 search "What does Alice prefer?" --user-id alice
```

### Connecting agents to Mem0

Mem0 ships as an Agent Skill (same SKILL.md format Trellis uses):
```bash
npx skills add https://github.com/mem0ai/mem0 --skill mem0
npx skills add https://github.com/mem0ai/mem0 --skill mem0-cli
```

This makes your AI agent (Claude Code, Codex, OpenCode, Copilot) aware of
Mem0's SDK and CLI. The agent can then store and retrieve memories during
sessions.

### Environment variables

Add to `.env.local` (see `.env.example` for the template):

```bash
# Mem0 (optional — only if you run the self-hosted server, mode 2)
MEM0_API_URL=http://localhost:8888
MEM0_API_KEY=<your-key-from-dashboard>
# LLM key for extraction (library mode or server mode)
OPENAI_API_KEY=<your-key>
```

### Stop and reset

Managed by mem0's own compose (run from the cloned `mem0/server` dir):
```bash
docker compose down       # stop (keeps data)
docker compose down -v    # stop and delete all memories
```

---

## Troubleshooting

### Docker daemon not running
```
Error response from daemon: ...
```
Fix: Start Docker Desktop (macOS/Windows) or run `sudo systemctl start docker` (Linux).

### Port already in use
```
Bind for 0.0.0.0:3000 failed: port is already allocated
```
Fix: Something is using that port. Either stop it or change the port mapping in the compose file.

### Mem0: won't start / no LLM configured
Mem0 needs an LLM key to extract memories, and its server needs `POSTGRES_PASSWORD`.
Check mem0's own `server/.env.example`: at minimum set `OPENAI_API_KEY` (or another
bundled provider key) and `POSTGRES_PASSWORD`. Trellis does not manage this stack —
run it from the cloned `mem0/server` directory.

### Phoenix: permission denied
```
permission denied while trying to connect to the Docker daemon socket
```
Fix: Add your user to the docker group (Linux): `sudo usermod -aG docker $USER`, then log out and back in.
