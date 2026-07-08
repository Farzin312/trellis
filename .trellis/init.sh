#!/usr/bin/env bash
set -euo pipefail

# ai-ready-scaffold — init script
# Run after git clone to initialize a new project from this template.
# Usage: ./init.sh "My Project Name" [--tier=N] [--with-graphify] [--with-bounds] [--agents=claude,copilot]
#
# --agents: comma-separated list of agent platforms to target.
#           Options: claude, codex, opencode, copilot
#           Default: all four
#           Example: --agents=claude,copilot (skip Codex + OpenCode)
#           Note: only the --agents=x form is supported (no space form).
#
# --tier:   1 Core / 2 Intelligence / 3 Full. Default 2.
#           Tier 1 installs no optional tools. Recorded in .trellis/config.json.

# No args on a TTY -> launch the interactive wizard (which re-invokes this
# script with flags). TRELLIS_WIZARD guards against re-entry.
if [ "$#" -eq 0 ] && [ -t 0 ] && [ -z "${TRELLIS_WIZARD:-}" ] && command -v node &>/dev/null; then
  exec node .trellis/scripts/wizard.mjs
fi

PROJECT_NAME="${1:-my-app}"
INSTALL_GRAPHIFY=false
INSTALL_BOUNDS=false
AGENTS=""
TIER=2
STACK=""

for arg in "$@"; do
  case "$arg" in
    --with-graphify) INSTALL_GRAPHIFY=true ;;
    --with-bounds)   INSTALL_BOUNDS=true ;;
    --agents=*)      AGENTS="${arg#--agents=}" ;;
    --tier=*)        TIER="${arg#--tier=}" ;;
    --stack=*)       STACK="${arg#--stack=}" ;;
  esac
done

# Default: all 4 agents
if [ -z "$AGENTS" ]; then
  AGENTS="claude,codex,opencode,copilot"
fi

# Validate tier (1 Core / 2 Intelligence / 3 Full); default 2 on bad input.
case "$TIER" in
  1|2|3) ;;
  *) echo "  [WARN] Invalid --tier=$TIER, defaulting to 2"; TIER=2 ;;
esac

# Tier 1 is core-only: never install optional tools regardless of --with-* flags.
if [ "$TIER" = "1" ]; then
  INSTALL_GRAPHIFY=false
  INSTALL_BOUNDS=false
fi

# Pinned external tool versions (bump these deliberately).
GRAPHIFY_VERSION="0.9.10"
BOUNDS_REF="1b5320c537d2830a570e75b8c4cedf53c3513c26"

# Steps we couldn't complete get collected here for an honest end-of-run summary.
SKIPPED=()

echo "=========================================="
echo "  ai-ready-scaffold — initializing"
echo "  Project: $PROJECT_NAME"
echo "=========================================="

# 0. Version preflight — warn up front, not mid-run.
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
  [ "$NODE_MAJOR" -ge 18 ] || echo "  [WARN] Node $(node -v) detected; Trellis needs Node >=18"
else
  echo "  [WARN] Node not found — most generators will be skipped (install: https://nodejs.org)"
fi
if [ "$INSTALL_GRAPHIFY" = true ] || [ "$INSTALL_BOUNDS" = true ]; then
  if command -v python3 &>/dev/null; then
    [ "$(python3 -c 'import sys; print(1 if sys.version_info>=(3,10) else 0)')" = "1" ] \
      || echo "  [WARN] Python $(python3 -V 2>&1 | awk '{print $2}') detected; Graphify needs Python >=3.10"
  else
    echo "  [WARN] Python 3 not found — Graphify/Bounds install will be skipped"
  fi
  command -v uv &>/dev/null || command -v pipx &>/dev/null || command -v pip3 &>/dev/null \
    || echo "  [WARN] No uv/pipx/pip3 on PATH — cannot install Graphify/Bounds"
fi

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
  node .trellis/scripts/generate-commands.mjs && echo "  [OK] Cross-tool commands generated" || { echo "  [WARN] Command generation failed"; SKIPPED+=("cross-tool commands"); }
else
  echo "  [WARN] Node not found — run 'node .trellis/scripts/generate-commands.mjs' manually"
  SKIPPED+=("cross-tool commands (need Node)")
fi

# 4. Sync mandate files (AGENTS.md -> CLAUDE.md)
if command -v node &>/dev/null; then
  node .trellis/scripts/check-mandate-sync.mjs --fix && echo "  [OK] Mandate files synced" || { echo "  [WARN] Mandate sync failed"; SKIPPED+=("mandate sync"); }
else
  SKIPPED+=("mandate sync (need Node)")
fi

# 4b. Adapt the framework to the project's stack (constitution + AGENTS.md scope)
if command -v node &>/dev/null; then
  if [ -n "$STACK" ]; then
    node .trellis/scripts/adapt-to-project.mjs --stack="$STACK" && echo "  [OK] Adapted to stack: $STACK" || { echo "  [WARN] Stack adaptation failed"; SKIPPED+=("stack adaptation"); }
  else
    node .trellis/scripts/adapt-to-project.mjs && echo "  [OK] Adapted to detected stack" || { echo "  [WARN] Stack adaptation failed"; SKIPPED+=("stack adaptation"); }
  fi
else
  SKIPPED+=("stack adaptation (need Node)")
fi

# 5. Copy stack-appropriate eval templates
if [ -f "package.json" ]; then
  if [ -d ".trellis/templates/js-ts" ]; then
    cp .trellis/templates/js-ts/vitest.config.ts vitest.config.ts 2>/dev/null || true
    cp .trellis/templates/js-ts/stryker.config.json stryker.config.json 2>/dev/null || true
    echo "  [OK] JS/TS eval templates copied to project root"
    echo "       Prerequisites: Node.js 18+ (https://nodejs.org)"
    echo "       Tools: vitest, strykerJS, fast-check (install via: npm install)"
  fi
elif [ -f "requirements.txt" ] || grep -q "^\[project\]" pyproject.toml 2>/dev/null; then
  if [ -d ".trellis/templates/python" ]; then
    cp .trellis/templates/python/pytest.ini pytest.ini 2>/dev/null || true
    cp .trellis/templates/python/mutmut.ini mutmut.ini 2>/dev/null || true
    echo "  [OK] Python eval templates copied to project root"
    echo "       Prerequisites: Python 3.10+ (https://python.org)"
    echo "       Install tools: pip install pytest pytest-cov mutmut hypothesis ruff"
  fi
elif [ -f "go.mod" ]; then
  if [ -d ".trellis/templates/go" ]; then
    cp .trellis/templates/go/README.md docs/eval-setup-go.md 2>/dev/null || true
    echo "  [OK] Go eval templates documented"
    echo "       Prerequisites: Go 1.21+ (https://go.dev/dl/)"
    echo "       Tools: go test, go-mutesting, golangci-lint"
    echo "       Install: go install github.com/zimmski/go-mutesting@latest"
    echo "       Install: https://golangci-lint.run/usage/install/"
  fi
elif [ -f "Cargo.toml" ]; then
  if [ -d ".trellis/templates/rust" ]; then
    cp .trellis/templates/rust/README.md docs/eval-setup-rust.md 2>/dev/null || true
    echo "  [OK] Rust eval templates documented"
    echo "       Prerequisites: Rust stable (https://rustup.rs)"
    echo "       Tools: cargo test, cargo-mutants, clippy"
    echo "       Install: cargo install cargo-mutants"
    echo "       Install: rustup component add clippy"
  fi
else
  echo "  [INFO] No recognized stack detected (package.json, requirements.txt, go.mod, Cargo.toml)"
  echo "         Eval templates available in .trellis/templates/ - copy manually as needed"
  echo "         Supported stacks: JS/TS, Python, Go, Rust"
fi

# 5b. Write agent config and generate skills to active platforms only
mkdir -p .trellis
ACTIVE_AGENTS_JSON=$(echo "$AGENTS" | tr ',' '\n' | sed 's/^/"/' | sed 's/$/"/' | paste -sd, - | sed 's/^/[/' | sed 's/$/]/')
cat > .trellis/config.json << CONFIG
{
  "active_agents": $ACTIVE_AGENTS_JSON,
  "active_tier": $TIER,
  "_comment": "Edit this to control which agent platforms receive skills and commands."
}
CONFIG
echo "  [OK] Agent config written: $AGENTS"

if command -v node &>/dev/null; then
  node .trellis/scripts/generate-skills.mjs && echo "  [OK] Skills mirrored to active platforms" || { echo "  [WARN] Skill generation failed"; SKIPPED+=("skills mirror"); }
else
  echo "  [WARN] Node not found — skills not mirrored. Run 'node .trellis/scripts/generate-skills.mjs' manually"
  SKIPPED+=("skills mirror (need Node)")
fi

# 6. Optional: install Graphify (always-on knowledge graph), pinned.
if [ "$INSTALL_GRAPHIFY" = true ]; then
  echo "  Installing Graphify (graphifyy==$GRAPHIFY_VERSION)..."
  if command -v uv &>/dev/null; then
    uv tool install "graphifyy==$GRAPHIFY_VERSION" || pip install "graphifyy==$GRAPHIFY_VERSION"
  elif command -v pip3 &>/dev/null; then
    pip3 install "graphifyy==$GRAPHIFY_VERSION"
  else
    echo "  [WARN] Cannot install Graphify — requires Python 3.10+ and uv/pip"
    echo "         Install manually: uv tool install graphifyy==$GRAPHIFY_VERSION && graphify install --project"
    SKIPPED+=("Graphify install (need uv/pip)")
  fi
  if command -v graphify &>/dev/null; then
    graphify install --project
    echo "  [OK] Graphify installed (run /graphify . in your AI assistant)"
  fi
fi

# 6b. Optional: install Bounds (boundary enforcement), pinned to a commit.
if [ "$INSTALL_BOUNDS" = true ]; then
  echo "  Installing Bounds (bounds@${BOUNDS_REF:0:12})..."
  if command -v pipx &>/dev/null; then
    pipx install "git+https://github.com/Farzin312/bounds.git@$BOUNDS_REF"
  elif command -v pip3 &>/dev/null; then
    pip3 install "git+https://github.com/Farzin312/bounds.git@$BOUNDS_REF"
  else
    echo "  [WARN] Cannot install Bounds — requires Python 3 and pipx/pip"
    SKIPPED+=("Bounds install (need pipx/pip)")
  fi
fi

# 7. Install npm dev dependencies (JS/TS only). Show the real error if it fails.
if [ -f "package.json" ]; then
  npm install --silent || { echo "  [WARN] npm install failed — see the error above; run 'npm install' manually"; SKIPPED+=("npm install"); }
fi

# 8. Create initial git hooks — only inside a real repo (don't fabricate a fake .git).
if git rev-parse --git-dir &>/dev/null; then
  echo "  Setting up git hooks..."
  HOOK_DIR="$(git rev-parse --git-path hooks)"
  mkdir -p "$HOOK_DIR"
  cat > "$HOOK_DIR/pre-commit" << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail
npm run check:mandates 2>/dev/null || true
npm run check:commands 2>/dev/null || true
npm run docs:check 2>/dev/null || true
HOOK
  chmod +x "$HOOK_DIR/pre-commit"
else
  echo "  [INFO] No git repo yet — run 'git init', then 'bash init.sh' again to add the pre-commit hook"
fi

echo ""
echo "=========================================="
if [ "${#SKIPPED[@]}" -eq 0 ]; then
  echo "  DONE — $PROJECT_NAME is ready"
else
  echo "  DONE (with warnings) — $PROJECT_NAME"
  echo "  Skipped: ${SKIPPED[*]}"
  echo "  Re-run after installing the missing prerequisites."
fi
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Install the CLI:  npm install -g .   (enables the 'trellis' command)"
echo "  2. Verify setup:     trellis check"
echo "  3. Read AGENTS.md — it routes you to everything"
echo "  4. Read docs/README-FOR-AGENTS.md if you are an AI agent"
echo "  5. Start your first spec:  trellis spec   (or see docs/sdd/sdd.md)"
echo ""
echo "Trivial changes (typo, config, <3 lines): fix, lint, commit."
echo "Non-trivial changes: run /specify and follow the SDD pipeline."
echo ""
echo "Supported AI agents: Claude Code | Codex CLI | OpenCode | Copilot"
