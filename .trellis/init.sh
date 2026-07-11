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
NAME_SET=false
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
      NAME_SET=true
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

CONFIG_EXISTS=false
[ -f .trellis/config.json ] && CONFIG_EXISTS=true

if [ -z "$PROJECT_NAME" ]; then
  if [ "$CONFIG_EXISTS" = true ]; then
    PROJECT_NAME="$(node --input-type=module -e '
      import { readProjectConfig } from "./.trellis/scripts/config-core.mjs";
      process.stdout.write(readProjectConfig(process.cwd()).project_name);
    ')"
  fi
  [ -n "$PROJECT_NAME" ] || PROJECT_NAME="$(basename "$PWD")"
fi

case "$PROJECT_NAME" in
  *[\\/]*|*[$'\n\r\t']*) usage ;;
esac

if [ "$CONFIG_EXISTS" = true ] && [ "$NAME_SET" = true ]; then
  EXISTING_NAME="$(node --input-type=module -e '
    import { readProjectConfig } from "./.trellis/scripts/config-core.mjs";
    process.stdout.write(readProjectConfig(process.cwd()).project_name);
  ')"
  if [ "$PROJECT_NAME" != "$EXISTING_NAME" ]; then
    echo "FAIL: project identity is already configured as '$EXISTING_NAME'; rename project-owned metadata explicitly." >&2
    exit 1
  fi
fi

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

if [ "$CONFIG_EXISTS" = false ]; then
  INTEGRATIONS=""
  [ "$WITH_GRAPHIFY" = true ] && INTEGRATIONS="graphify"
  if [ "$WITH_BOUNDS" = true ]; then
    [ -n "$INTEGRATIONS" ] && INTEGRATIONS="$INTEGRATIONS,bounds" || INTEGRATIONS="bounds"
  fi
  node --input-type=module -e '
    import { writeProjectConfig } from "./.trellis/scripts/config-core.mjs";
    const [name, slug, stacks, integrations] = process.argv.slice(1);
    const config = {
      schema_version: 1,
      project_name: name,
      project_slug: slug,
      stacks: stacks.split(","),
      enabled_integrations: integrations ? integrations.split(",") : [],
    };
    writeProjectConfig(process.cwd(), config);
  ' "$PROJECT_NAME" "$SLUG" "$STACK" "$INTEGRATIONS"
  echo "CREATE .trellis/config.json"

  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    function writeAtomic(file, content) {
      const temporary = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}-${Date.now()}`);
      fs.writeFileSync(temporary, content);
      fs.renameSync(temporary, file);
    }
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
      writeAtomic("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
      const packageEntry = {
        name: pkg.name,
        version: pkg.version,
        bin: pkg.bin,
        engines: pkg.engines,
      };
      const lock = {
        name: pkg.name,
        version: pkg.version,
        lockfileVersion: 3,
        requires: true,
        packages: { "": packageEntry },
      };
      writeAtomic("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);
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
  if [ ! -e docs/README.md ]; then
    node -e '
      const fs = require("node:fs");
      fs.mkdirSync("docs", { recursive: true });
      fs.writeFileSync("docs/README.md", `# Project documentation\n\n> Parent: [project README](../README.md)\n\n## Agent guidance\n\n- [Agent routing](./README-FOR-AGENTS.md)\n- [Documentation structure](./STRUCTURE.md)\n- [Coding standards](./coding-standards.md)\n- [Spec-driven development](./sdd/sdd.md)\n\n## Toolkit references\n\n- [Repository mapping and optional architecture tools](./repository-mapping.md)\n- [Evaluation contract](./evals.md)\n- [Language support](./language-support.md)\n- [Metrics ledger](./metrics.md)\n- [Optional Phoenix service](./self-hosted-services.md)\n- [Agent Skills](./skills.md)\n- [Credits and licenses](./credits.md)\n\n## Project records\n\n- [System documentation](./systems/README.md)\n- [Bug-fix register](./bug-fixes/README.md)\n- Active delivery evidence lives under \`.specify/specs/\`.\n`);
    ' 
    echo "CREATE docs/README.md"
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
    echo "SKIP pre-commit hook: Trellis does not modify project Git hooks"
  fi
fi

echo "PASS: Trellis configured for $PROJECT_NAME ($STACK)"
if [ "$WITH_GRAPHIFY" = true ]; then
  echo "NEXT: install Graphify, then run trellis graph"
fi
if [ "$WITH_BOUNDS" = true ]; then
  echo "NEXT: install Bounds, then run bounds guide and review discovered ownership"
fi
