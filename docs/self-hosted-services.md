# Self-Hosted Services Setup

> Parent: `docs/README.md`

Trellis ships two optional self-hosted services. Both are free and open-source.
Neither is required for the framework to function — they enhance specific
capabilities.

| Service | Purpose | When to add | License | Port |
|---------|---------|-------------|---------|------|
| Arize Phoenix | Agent observability (traces, token cost, failures) | Tier 3 | ELv2 (free self-host) | 6006 |
| Mem0 | Semantic agent memory (search, entity linking) | Optional upgrade | Apache-2.0 | 3000 |

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
embeddings (`ollama pull nomic-embed-text`).

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

**Default in Trellis:** Trellis ships `.agents/context/` (plain JSON files) as
the zero-dependency default. Mem0 is the upgrade when you need capabilities
JSON files cannot provide.

### When to upgrade to Mem0

| Need | Use .agents/context/ | Use Mem0 |
|------|---------------------|----------|
| Save decisions and learnings | Yes | Yes |
| Resume where last session left off | Yes | Yes |
| Search by keyword | Yes (grep) | Yes (semantic) |
| "Find decisions about auth from last month" | No | Yes |
| Entity graphs across memories | No | Yes |
| Shared team dashboard | No | Yes |
| Zero dependencies | Yes | No (needs LLM) |

### Three modes

**1. Library mode (no server, in-process):**
```bash
pip install mem0ai
```
Uses an LLM in-process. Good for prototypes. No dashboard.

**2. Self-hosted server (recommended for teams):**
```bash
# Ensure Docker is running
docker info

# Start Mem0 + Qdrant (vector store)
docker compose -f docker-compose.mem0.yml up -d
```
Dashboard: http://localhost:3000

On first launch, the dashboard walks you through creating an admin account
and generating your first API key. Auth is ON by default. For local dev only,
you can set `AUTH_DISABLED=true` in the compose file or `.env.local`.

**3. CLI (from terminal):**
```bash
npm install -g @mem0/cli
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
# Mem0 (optional — only if using server mode)
MEM0_API_URL=http://localhost:3000
MEM0_API_KEY=<your-key-from-dashboard>
# LLM provider (if using OpenAI for Mem0's extraction)
OPENAI_API_KEY=<your-key>
```

### Stop and reset

```bash
# Stop Mem0 (keeps data)
docker compose -f docker-compose.mem0.yml down

# Stop and delete all memories
docker compose -f docker-compose.mem0.yml down -v
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

### Mem0: LLM not configured
Mem0 will not start without an LLM provider. Check that either:
- `OPENAI_API_KEY` is set in your environment, OR
- You've uncommented the Ollama configuration in `docker-compose.mem0.yml`

### Phoenix: permission denied
```
permission denied while trying to connect to the Docker daemon socket
```
Fix: Add your user to the docker group (Linux): `sudo usermod -aG docker $USER`, then log out and back in.
