#!/usr/bin/env bash
set -euo pipefail

# Configure a checkout that already contains Trellis.
# Usage: bash .trellis/init.sh [name] [--stack=x,y]
#        [--with-graphify] [--with-bounds]

usage() {
  echo "Usage: init.sh [name] [--stack=generic,javascript,typescript,python,go,rust] [--with-graphify] [--with-bounds]" >&2
  exit 2
}

if [ "$#" -eq 0 ] && [ -t 0 ] && [ -z "${TRELLIS_WIZARD:-}" ]; then
  exec node .trellis/scripts/wizard.mjs
fi

PROJECT_NAME=""
STACK=""
STACK_SET=false
WITH_GRAPHIFY=false
WITH_BOUNDS=false

for arg in "$@"; do
  case "$arg" in
    --stack=*) STACK="${arg#--stack=}"; STACK_SET=true ;;
    --with-graphify) WITH_GRAPHIFY=true ;;
    --with-bounds) WITH_BOUNDS=true ;;
    --*) usage ;;
    *)
      [ -z "$PROJECT_NAME" ] || usage
      PROJECT_NAME="$arg"
      ;;
  esac
done

command -v node >/dev/null 2>&1 || {
  echo "FAIL: Node.js 20 or newer is required." >&2
  exit 1
}
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || {
  echo "FAIL: Node.js 20 or newer is required; found $(node --version)." >&2
  exit 1
}

if [ -z "$PROJECT_NAME" ]; then
  if [ -f .trellis/config.json ]; then
    PROJECT_NAME="$(node -e 'const c=require("./.trellis/config.json"); process.stdout.write(c.project_name || "")')"
  fi
  [ -n "$PROJECT_NAME" ] || PROJECT_NAME="$(basename "$PWD")"
fi

case "$PROJECT_NAME" in
  *[\\/]*|*[$'\n\r\t']*) usage ;;
esac

normalize_csv() {
  node -e '
    const raw = process.argv[1];
    const allowed = new Set(["generic", "javascript", "typescript", "python", "go", "rust"]);
    const values = raw.split(",").map((value) => value.trim());
    if (values.some((value) => !value || !allowed.has(value))) process.exit(2);
    const unique = [...new Set(values)];
    if (unique.includes("generic") && unique.length > 1) process.exit(2);
    process.stdout.write(unique.join(","));
  ' "$1"
}

if [ "$STACK_SET" = true ]; then
  if ! STACK="$(normalize_csv "$STACK")"; then usage; fi
else
  DETECT_ARGS=()
  [ -f package.json ] && DETECT_ARGS+=(javascript)
  [ -f tsconfig.json ] && DETECT_ARGS+=(typescript)
  { [ -f pyproject.toml ] || [ -f requirements.txt ]; } && DETECT_ARGS+=(python)
  [ -f go.mod ] && DETECT_ARGS+=(go)
  [ -f Cargo.toml ] && DETECT_ARGS+=(rust)
  if [ "${#DETECT_ARGS[@]}" -eq 0 ]; then
    STACK="generic"
  else
    STACK="$(IFS=,; echo "${DETECT_ARGS[*]}")"
    STACK="$(normalize_csv "$STACK")"
  fi
fi

SLUG="$(node -e '
  const value = process.argv[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!value) process.exit(2);
  process.stdout.write(value);
' "$PROJECT_NAME")" || usage

CONFIG_EXISTS=false
[ -f .trellis/config.json ] && CONFIG_EXISTS=true

if [ "$CONFIG_EXISTS" = false ]; then
  INTEGRATIONS=""
  [ "$WITH_GRAPHIFY" = true ] && INTEGRATIONS="graphify"
  if [ "$WITH_BOUNDS" = true ]; then
    [ -n "$INTEGRATIONS" ] && INTEGRATIONS="$INTEGRATIONS,bounds" || INTEGRATIONS="bounds"
  fi
  node -e '
    const fs = require("node:fs");
    const [name, slug, stacks, integrations] = process.argv.slice(1);
    const config = {
      schema_version: 1,
      project_name: name,
      project_slug: slug,
      stacks: stacks.split(","),
      enabled_integrations: integrations ? integrations.split(",") : [],
    };
    fs.writeFileSync(".trellis/config.json.tmp", `${JSON.stringify(config, null, 2)}\n`);
    fs.renameSync(".trellis/config.json.tmp", ".trellis/config.json");
  ' "$PROJECT_NAME" "$SLUG" "$STACK" "$INTEGRATIONS"
  echo "CREATE .trellis/config.json"

  node -e '
    const fs = require("node:fs");
    if (!fs.existsSync("package.json")) process.exit(0);
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    if (pkg.name === "trellis-agent-toolkit") {
      pkg.name = process.argv[1];
      pkg.private = true;
      pkg.description = "Repository initialized with Trellis.";
      delete pkg.type;
      delete pkg.license;
      delete pkg.author;
      delete pkg.keywords;
      delete pkg.files;
      delete pkg.repository;
      delete pkg.homepage;
      delete pkg.bugs;
      fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
      if (fs.existsSync("package-lock.json")) {
        const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
        lock.name = process.argv[1];
        if (lock.packages?.[""]) lock.packages[""].name = process.argv[1];
        fs.writeFileSync("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);
      }
    }
  ' "$SLUG"

  if [ ! -e README.md ]; then
    node -e '
      const fs = require("node:fs");
      const name = process.argv[1];
      fs.writeFileSync("README.md", `# ${name}\n\nThis repository uses Trellis for durable AI-agent guidance and verification.\n\n## Start here\n\n- Add application-specific prerequisites and run commands when application code is introduced.\n- AI coding agents start at [AGENTS.md](./AGENTS.md).\n- Run \`npm run check\` to verify the Trellis contract.\n- Start non-trivial work with the \`speckit-specify\` Agent Skill.\n\n## License\n\nNo license has been selected for this project. Trellis-owned files under \`.trellis/\` retain the MIT license in [\`.trellis/LICENSE\`](./.trellis/LICENSE).\n`);
    ' "$PROJECT_NAME"
    echo "CREATE README.md"
  fi
else
  echo "KEEP .trellis/config.json"
  if [ "$STACK_SET" = false ]; then
    STACK="$(node -e 'const c=require("./.trellis/config.json"); process.stdout.write((c.stacks || ["generic"]).join(","))')"
  fi
fi

if [ -f .trellis/scripts/adapt-to-project.mjs ]; then
  node .trellis/scripts/adapt-to-project.mjs --stack="$STACK"
fi

if [ -f .trellis/scripts/check-mandate-sync.mjs ]; then
  node .trellis/scripts/check-mandate-sync.mjs --fix
fi
if [ -f .trellis/scripts/generate-skills.mjs ]; then
  node .trellis/scripts/generate-skills.mjs
fi

if [ "$CONFIG_EXISTS" = true ] && [ -f .trellis/scripts/config.mjs ]; then
  [ "$WITH_GRAPHIFY" = false ] || node .trellis/scripts/config.mjs enable graphify
  [ "$WITH_BOUNDS" = false ] || node .trellis/scripts/config.mjs enable bounds
fi

if git rev-parse --git-dir >/dev/null 2>&1; then
  HOOK_DIR="$(git rev-parse --git-path hooks)"
  HOOK="$HOOK_DIR/pre-commit"
  if [ -e "$HOOK" ]; then
    echo "KEEP pre-commit hook"
  else
    mkdir -p "$HOOK_DIR"
    printf '%s\n' '#!/usr/bin/env bash' 'set -euo pipefail' 'npm run check' > "$HOOK"
    chmod +x "$HOOK"
    echo "CREATE pre-commit hook"
  fi
fi

echo "PASS: Trellis configured for $PROJECT_NAME ($STACK)"
if [ "$WITH_GRAPHIFY" = true ]; then
  echo "NEXT: install Graphify, then run graphify install --project"
fi
if [ "$WITH_BOUNDS" = true ]; then
  echo "NEXT: install Bounds, then run bounds init and assign subsystem ownership"
fi
