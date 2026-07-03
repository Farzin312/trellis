#!/usr/bin/env bash
set -euo pipefail

# ai-ready-scaffold — init script
# Run after git clone to initialize a new project from this template.
# Usage: ./init.sh "My Project Name" [--with-graphify] [--with-bounds] [--agents=claude,copilot]
#
# --agents: comma-separated list of agent platforms to target.
#           Options: claude, codex, opencode, copilot
#           Default: all four
#           Example: --agents=claude,copilot (skip Codex + OpenCode)

PROJECT_NAME="${1:-my-app}"
INSTALL_GRAPHIFY=false
INSTALL_BOUNDS=false
AGENTS=""

for arg in "$@"; do
  case "$arg" in
    --with-graphify) INSTALL_GRAPHIFY=true ;;
    --with-bounds)   INSTALL_BOUNDS=true ;;
    --agents)        shift_for_agents=true ;;
    --agents=*)      AGENTS="${arg#--agents=}" ;;
  esac
done

# Default: all 4 agents
if [ -z "$AGENTS" ]; then
  AGENTS="claude,codex,opencode,copilot"
fi

echo "=========================================="
echo "  ai-ready-scaffold — initializing"
echo "  Project: $PROJECT_NAME"
echo "=========================================="

# 1. Normalize project name to a slug
SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
echo "  Slug: $SLUG"

# 2. Inject project name into key files
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/__PROJECT_NAME__/$PROJECT_NAME/g" AGENTS.md package.json .specify/memory/constitution.md docs/STRUCTURE.md 2>/dev/null || true
  sed -i '' "s/__PROJECT_SLUG__/$SLUG/g" .bounds/root.yaml package.json 2>/dev/null || true
else
  sed -i "s/__PROJECT_NAME__/$PROJECT_NAME/g" AGENTS.md package.json .specify/memory/constitution.md docs/STRUCTURE.md 2>/dev/null || true
  sed -i "s/__PROJECT_SLUG__/$SLUG/g" .bounds/root.yaml package.json 2>/dev/null || true
fi
echo "  [OK] Project name injected"

# 3. Generate platform-specific command mirrors from .specify source
if command -v node &>/dev/null; then
  node scripts/generate-commands.mjs && echo "  [OK] Cross-tool commands generated" || echo "  [WARN] Command generation skipped (node required)"
else
  echo "  [WARN] Node not found — run 'node scripts/generate-commands.mjs' manually"
fi

# 4. Sync mandate files (AGENTS.md -> CLAUDE.md)
if command -v node &>/dev/null; then
  node scripts/check-mandate-sync.mjs --fix && echo "  [OK] Mandate files synced" || echo "  [WARN] Mandate sync skipped"
fi

# 5. Copy stack-appropriate eval templates
if [ -f "package.json" ]; then
  if [ -d "templates/js-ts" ]; then
    cp templates/js-ts/vitest.config.ts vitest.config.ts 2>/dev/null || true
    cp templates/js-ts/stryker.config.json stryker.config.json 2>/dev/null || true
    echo "  [OK] JS/TS eval templates copied to project root"
    echo "       Prerequisites: Node.js 18+ (https://nodejs.org)"
    echo "       Tools: vitest, strykerJS, fast-check (install via: npm install)"
  fi
elif [ -f "requirements.txt" ] || grep -q "^\[project\]" pyproject.toml 2>/dev/null; then
  if [ -d "templates/python" ]; then
    cp templates/python/pytest.ini pytest.ini 2>/dev/null || true
    cp templates/python/mutmut.ini mutmut.ini 2>/dev/null || true
    echo "  [OK] Python eval templates copied to project root"
    echo "       Prerequisites: Python 3.10+ (https://python.org)"
    echo "       Install tools: pip install pytest pytest-cov mutmut hypothesis ruff"
  fi
elif [ -f "go.mod" ]; then
  if [ -d "templates/go" ]; then
    cp templates/go/README.md docs/eval-setup-go.md 2>/dev/null || true
    echo "  [OK] Go eval templates documented"
    echo "       Prerequisites: Go 1.21+ (https://go.dev/dl/)"
    echo "       Tools: go test, go-mutesting, golangci-lint"
    echo "       Install: go install github.com/zimmski/go-mutesting@latest"
    echo "       Install: https://golangci-lint.run/usage/install/"
  fi
elif [ -f "Cargo.toml" ]; then
  if [ -d "templates/rust" ]; then
    cp templates/rust/README.md docs/eval-setup-rust.md 2>/dev/null || true
    echo "  [OK] Rust eval templates documented"
    echo "       Prerequisites: Rust stable (https://rustup.rs)"
    echo "       Tools: cargo test, cargo-mutants, clippy"
    echo "       Install: cargo install cargo-mutants"
    echo "       Install: rustup component add clippy"
  fi
else
  echo "  [INFO] No recognized stack detected (package.json, requirements.txt, go.mod, Cargo.toml)"
  echo "         Eval templates available in templates/ - copy manually as needed"
  echo "         Supported stacks: JS/TS, Python, Go, Rust"
fi

# 5b. Write agent config and generate skills to active platforms only
mkdir -p .trellis
ACTIVE_AGENTS_JSON=$(echo "$AGENTS" | tr ',' '\n' | sed 's/^/"/' | sed 's/$/"/' | paste -sd, - | sed 's/^/[/' | sed 's/$/]/')
cat > .trellis/config.json << CONFIG
{
  "active_agents": $ACTIVE_AGENTS_JSON,
  "active_tier": 2,
  "_comment": "Edit this to control which agent platforms receive skills and commands."
}
CONFIG
echo "  [OK] Agent config written: $AGENTS"

if command -v node &>/dev/null; then
  node scripts/generate-skills.mjs && echo "  [OK] Skills mirrored to active platforms" || echo "  [WARN] Skill generation skipped"
else
  echo "  [WARN] Node not found — skills not mirrored. Run 'node scripts/generate-skills.mjs' manually"
fi

# 6. Optional: install Graphify (always-on knowledge graph)
if [ "$INSTALL_GRAPHIFY" = true ]; then
  echo "  Installing Graphify..."
  if command -v uv &>/dev/null; then
    uv tool install graphifyy || pip install graphifyy
  elif command -v pip3 &>/dev/null; then
    pip3 install graphifyy
  else
    echo "  [WARN] Cannot install Graphify — requires Python 3.10+ and uv/pip"
    echo "         Install manually: uv tool install graphifyy && graphify install --project"
  fi
  if command -v graphify &>/dev/null; then
    graphify install --project
    echo "  [OK] Graphify installed (run /graphify . in your AI assistant)"
  fi
fi

# 6. Optional: install Bounds (boundary enforcement)
if [ "$INSTALL_BOUNDS" = true ]; then
  echo "  Installing Bounds..."
  if command -v pipx &>/dev/null; then
    pipx install "git+https://github.com/Farzin312/bounds.git"
  elif command -v pip3 &>/dev/null; then
    pip3 install "git+https://github.com/Farzin312/bounds.git"
  else
    echo "  [WARN] Cannot install Bounds — requires Python 3 and pipx/pip"
  fi
fi

# 7. Install npm dev dependencies (JS/TS only)
if [ -f "package.json" ]; then
  npm install --silent 2>/dev/null || echo "  [WARN] npm install failed — run manually"
fi

# 8. Create initial git hooks
echo "  Setting up git hooks..."
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail
npm run check:mandates 2>/dev/null || true
npm run check:commands 2>/dev/null || true
npm run docs:check 2>/dev/null || true
HOOK
chmod +x .git/hooks/pre-commit

echo ""
echo "=========================================="
echo "  DONE — $PROJECT_NAME is ready"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Read AGENTS.md — it routes you to everything"
echo "  2. Read docs/README-FOR-AGENTS.md if you are an AI agent"
echo "  3. Read docs/STRUCTURE.md for documentation rules"
echo "  4. Skills are in .agents/skills/ — mirrored to all 4 platforms"
echo "  5. Start your first spec: see docs/sdd/sdd.md"
echo ""
echo "Trivial changes (typo, config, <3 lines): fix, lint, commit."
echo "Non-trivial changes: run /specify and follow the SDD pipeline."
echo ""
echo "Supported AI agents: Claude Code | Codex CLI | OpenCode | Copilot"
