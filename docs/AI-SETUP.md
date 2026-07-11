# AI-assisted Trellis setup

> Parent: [documentation index](./README.md)

Use this route when an AI coding agent will inspect, download, merge, and verify
Trellis for you. The agent must collect every mandatory answer and show a
validated plan before it changes the target repository or installs a tool.

## Copy this prompt

```text
Set up Trellis for this project by following the official guide at
https://raw.githubusercontent.com/Farzin312/trellis/main/docs/AI-SETUP.md.
Inspect the project read-only first. Ask every mandatory question in order and
do not modify the target, install tools, or create a repository until you have
validated the answers, explained benefits and drawbacks, shown the full plan,
and received my final approval. Continue through verification and report every
warning, skip, or open external proof honestly.
```

The raw URL makes the interview accessible before Trellis exists locally. The
guide is instructions, not executable remote code; the agent should show which
official source it will clone before downloading it.

## Mandatory interview

The agent asks these decisions sequentially and records every answer:

1. new project or existing repository;
2. safe target directory for a new project;
3. human-readable project name;
4. concrete repository scope;
5. actual root stacks;
6. trust-sensitive surfaces: auth, payments, personal data, secrets, database,
   deployment, or an explicit `none`;
7. whether one complete `check:project` command is already configured;
8. whether a semantic graph, enforced boundaries, or local observability solves
   a current need;
9. for each selected add-on, whether its external tools are already installed,
   approved for installation, or forbidden;
10. acknowledgement of the stated trade-offs.

“Recommended” is not an answer. The agent cannot go forward while a mandatory
answer is absent, contradictory, or outside the allowed contract.

## One core, optional add-ons

Trellis does not ship separate lite/pro/full packages. Profiles are descriptive
recommendations over one core:

| Profile | Benefit | Drawback | Choose when |
|---|---|---|---|
| Trellis Core | Portable guidance, SDD, deterministic checks, and a cheap structural map; no paid service | The project owner still wires application gates and trust boundaries | Default for every project |
| Core + Graphify | Deeper symbol and relationship queries | Python CLI, project Agent Skill, generated graph, and CI maintenance | Large or unfamiliar codebases need semantic traversal |
| Core + Bounds | Verified ownership, blast radius, and boundary drift gates | Curated manifests, complete coverage, and intentional re-baselining | Architecture boundaries are stable enough to enforce |
| Core + Graphify + Bounds | Exploration plus intended-architecture enforcement | Both maintenance surfaces apply | Mature systems need both questions answered |
| Phoenix add-on | Local trace inspection after instrumentation | Docker, ports, storage, and application-owned telemetry code | Agent or LLM traces are an actual debugging need |

## Validate before execution

After every answer is collected, the agent may ask permission to clone the
official Trellis source into an operating-system temporary directory. It then
runs, from that source checkout:

```bash
node .trellis/cli.mjs setup questions --json
node .trellis/cli.mjs setup plan --answers=<temporary-answers.json> --json
# If the source CLI is installed on PATH, the equivalent forms are:
trellis setup questions --json
trellis setup plan --answers=<temporary-answers.json> --json
```

The answer file contains no credentials and stays outside the target. The plan
command is read-only. A validation error returns to the named question. The
agent explains every action, external write, license boundary, blocking review,
and open project gate, then asks for final approval.

## Execute the approved plan

For a new project, the agent uses the plan's argument array with the checked-out
CLI. For an existing repository, it creates a reference scaffold outside the
target and follows the [brownfield adoption guide](./adopting-existing-projects.md).
Existing package scripts, `AGENTS.md`, README, license, CI, Git hooks, and docs
are merged by meaning. This is a reviewed merge, never a bulk overwrite.

The agent records the approved scope and risk surfaces in project guidance. It
defines one `check:project` script covering build, lint, type, test, migration,
browser, and integration gates before describing application evidence as
complete.

Selected external dependencies are handled only under the recorded policy:

- Graphify: pinned CLI, `graphify install --project --platform agents`, Claude
  mirror generation, root graph build, then integration verification.
- Bounds: pinned source commit, initialization, draft discovery, human/agent
  review, complete supported-source coverage, passing
  `bounds preflight --fail-on-unowned`, then enablement.
- Phoenix: Docker verification, pinned localhost service, and project-owned
  instrumentation. A running empty dashboard is not trace evidence.

The policy is per capability. Approval to install one prerequisite does not
authorize another download, global installation, Docker change, or service.

## Completion contract

The agent runs focused setup checks and then:

```bash
npm run check
```

Completion requires all mandatory evidence, no unreviewed merge or Bounds draft,
and no missing selected dependency. `WARN` and `SKIP` remain visible and are not
passes. The agent removes only the temporary planner files it created.

The same decisions and commands are available without an AI in the
[manual setup guide](./manual-setup.md).
