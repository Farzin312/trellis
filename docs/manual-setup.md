# Manual Trellis setup

> Parent: [documentation index](./README.md)

This route gives a human the same mandatory decisions and validated plan as the
AI-assisted path. It does not require an LLM or credential.

## 1. Get the source

Core prerequisites are Git, Node.js 22+, npm, and Bash (macOS/Linux or WSL on
Windows). Native PowerShell, `cmd.exe`, and Git Bash initialization are not
CI-tested.

```bash
git clone https://github.com/Farzin312/trellis.git
cd trellis
npm ci --ignore-scripts
node .trellis/cli.mjs --version
```

The current distribution is source-based, not an npm registry release. Review
the checked-out commit before using it in a controlled environment.

## 2. Answer every setup question

```bash
node .trellis/cli.mjs setup questions
node .trellis/cli.mjs setup questions --json
# After installing the source CLI on PATH:
trellis setup questions --json
```

Create a temporary JSON file containing every required field. Do not put
credentials in it. The choices cover new/existing mode, target, project name and
scope, stacks, risk surfaces, `check:project`, optional needs, external-tool
policy for each add-on, and trade-off acknowledgement. Unselected add-ons use
`not-selected`; selected add-ons use `already-installed` or
`install-approved`.

The command prints this complete shape example. Replace every project-specific
value; it is not a recommendation:

```json
{
  "schema_version": 1,
  "mode": "new",
  "target_directory": "example-project",
  "project_name": "Example Project",
  "project_scope": "Replace this with the concrete responsibility of the repository.",
  "stacks": ["generic"],
  "risk_surfaces": ["none"],
  "project_gate": "not-yet",
  "needs": {
    "semantic_graph": false,
    "enforced_boundaries": false,
    "local_observability": false
  },
  "external_tool_policy": {
    "semantic_graph": "not-selected",
    "enforced_boundaries": "not-selected",
    "local_observability": "not-selected"
  },
  "tradeoffs_acknowledged": true
}
```

For `mode=existing`, omit `target_directory`. Do not keep `risk_surfaces=none`
or `stacks=["generic"]` when read-only inspection finds a real risk or stack.

Generate both a readable and machine-readable plan:

```bash
node .trellis/cli.mjs setup plan --answers=<temporary-answers.json>
node .trellis/cli.mjs setup plan --answers=<temporary-answers.json> --json
# Equivalent installed-CLI form:
trellis setup plan --answers=<temporary-answers.json> --json
```

The command validates only and performs no writes. Missing answers, unsafe
paths, contradictory `none`/`generic` combinations, unacknowledged trade-offs,
or selected add-ons with a forbidden dependency policy fail with exit `2`.

## 3. Choose one core plus justified add-ons

| Capability | Benefit | Drawback |
|---|---|---|
| Trellis Core | Cross-agent guidance, nine-phase SDD, deterministic gates, and a read-only map | You must supply project scope, trust boundaries, and application checks |
| Graphify | Deeper symbol/dependency questions | Python 3.10+, a project skill, generated graph state, and CI upkeep |
| Bounds | Verified subsystem ownership and boundary enforcement | Ownership review, complete coverage, and maintained manifests |
| Phoenix | Local trace UI after instrumentation | Docker, ports, persistent storage, and SDK work |

These are not product editions. Start with Core and add only a capability whose
maintenance cost is justified by a current problem.

## 4. Create or merge the core

For a new repository, run the exact `trellis new` argument array printed by the
plan. For an unrelated existing repository, follow
[adopting-existing-projects.md](./adopting-existing-projects.md); never copy a
reference scaffold over existing policy, package metadata, README, license, CI,
hooks, or documentation.

Replace the managed scope sentence in `AGENTS.md` with the approved
`project_scope` and record the selected `risk_surfaces` beside it. This is a
blocking review action in the plan: generic generated scope is not evidence that
the agent understands the repository.

Configure one complete application gate in `package.json`:

```json
{
  "scripts": {
    "check:project": "<lint + build + type + test + migration/browser/integration gates>"
  }
}
```

Do not call `npm test`, `npm run check`, `trellis check`, or `trellis eval` from
`check:project`; those are Trellis wrappers and recursion is blocked.

## 5. Configure selected dependencies

Only perform these steps when the validated plan selected the capability and
that capability's external-tool policy permits installation. Permission for one
add-on does not authorize another tool or Docker change.

### Graphify

```bash
uv tool install graphifyy==0.9.10
graphify install --project --platform agents
npm run skills:generate
trellis config enable graphify
trellis graph
npm run check:integrations
```

The project-scoped generic skill belongs under `.agents/skills/`; Trellis then
generates the Claude mirror. Do not add a `.codex` skills directory.

### Bounds

```bash
pipx install "git+https://github.com/Farzin312/bounds.git@a504befeeea7448791538e2a6f8ad1f2259932eb"
bounds guide
bounds init --root
bounds discover --apply
bounds coverage
bounds preflight --fail-on-unowned
trellis config enable bounds
```

Review discovery output before enablement. Complete coverage and a passing
preflight are required; command presence or `bounds validate --quick` alone is
not boundary proof.

### Phoenix

```bash
docker info
trellis services start phoenix
trellis services status phoenix
```

Then add project-owned instrumentation from current Phoenix documentation. The
container alone produces no traces.

## 6. Verify

```bash
npm ci --ignore-scripts
npm run check
```

Inspect every `WARN` and `SKIP`. Remove the temporary answer file when it is no
longer needed. Keep selected tool installation and CI setup synchronized.

For an agent-led version of the same contract, use
[AI-assisted setup](./AI-SETUP.md).
