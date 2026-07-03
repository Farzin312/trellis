#!/usr/bin/env bash
set -euo pipefail

# ai-ready-scaffold — init script
# Run after git clone to initialize a new project from this template.
# Usage: ./init.sh "My Project Name" [--with-graphify] [--with-bounds]

PROJECT_NAME="${1:-my-app}"
INSTALL_GRAPHIFY=false
INSTALL_BOUNDS=false

for arg in "$@"; do
  case "$arg" in
    --with-graphify) INSTALL_GRAPHIFY=true ;;
    --with-bounds)   INSTALL_BOUNDS=true ;;
  esac
done

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

# 5. Optional: install Graphify (always-on knowledge graph)
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

# 7. Install npm dev dependencies
if [ -f "package.json" ]; then
  echo "  Installing dev dependencies..."
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
echo "  4. Read .agents/handoffs/registry.yaml for agent handoff loops"
echo "  5. Run 'graphify .' to build the knowledge graph"
echo "  6. Start your first spec: see docs/sdd/sdd.md"
echo ""
echo "To start dev: npm run dev (configure your framework in app/)"
