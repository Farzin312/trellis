# Trellis

Trellis is a source-distributed Node.js toolkit for starting repositories with
durable agent guidance, reusable Agent Skills, a nine-phase spec-driven
workflow, and deterministic local checks. It scaffolds new projects and can
reconfigure a checkout that already contains Trellis. Adopting an unrelated
existing repository remains a review-and-merge task; Trellis does not silently
rewrite arbitrary project policy.

## What Trellis does

- `trellis new <name>` creates a new project from Trellis-owned template files.
- `trellis init [name]` validates and configures a checkout without replacing
  user-owned policy or configuration files.
- `AGENTS.md` holds durable repository guidance. Agent Skills are authored in
  `.agents/skills/`; `.claude/skills/` is the generated Claude compatibility
  mirror.
- `trellis eval` runs required toolkit self-tests and configured project tests,
  reporting passes, failures, warnings, and skips separately.
- `trellis map` prints a bounded structural repository map without an LLM or
  optional tool.
- `npm run check` is the release gate for this repository.
- Graphify, Bounds, and Phoenix are optional integrations. Their absence is not
  described as successful evidence.

Trellis provides workflow and verification infrastructure. It does not
guarantee an agent's output or install application dependencies.
Trellis does not configure application authentication. Authentication,
authorization, secrets, and money
flows remain the adopting project's responsibility and must fail closed.

## Positioning

Trellis is for teams that want agent operating rules and proof to travel with
the repository. It is not a hosted agent runtime, model router, IDE, or guarantee
of generated-code quality.

The useful bundle is narrower and concrete: shared Agent Skills, a complete SDD
chain, safe project creation, a dependency-free structural map, configuration-
aware optional architecture tools, documentation integrity checks, and portable
self-tests behind one blocking command. Projects can use only the core and add
Graphify, Bounds, or Phoenix when their actual scale justifies them.

[GitHub Spec Kit](https://github.com/github/spec-kit) and
[OpenSpec](https://github.com/Fission-AI/OpenSpec) are credible alternatives for
spec-centered workflows. Trellis's emphasis is the surrounding repository
governance and honest evidence contract, not a claim that other tools cannot
support agent workflows.

## Prerequisites and support

Core use requires:

- Git
- Node.js 22 or newer (use a currently supported LTS release; see the
  [Node.js release schedule](https://nodejs.org/en/about/previous-releases))
- npm
- Bash (macOS or Linux; on Windows use WSL or Git Bash)
- at least one AI coding agent if you want to run the Agent Skills

Core initialization, help, checks, and documentation verification need no LLM
credential or paid service. Graphify and Bounds additionally require Python
3.10+ and an installer such as `uv` or `pipx`; Phoenix requires Docker. Graphify
can index code without an LLM key, while its document extraction features may
require a supported provider credential.

The release checks run on macOS and CI targets Ubuntu. Native PowerShell and
`cmd.exe` initialization are not claimed; Windows users need WSL or Git Bash.

Compatibility reviewed: 2026-07-11.

| Agent surface | Trellis path | Status and source |
|---|---|---|
| Codex | `.agents/skills/` and `AGENTS.md` | Native project paths; see [OpenAI's skill guide](https://learn.chatgpt.com/docs/build-skills) |
| OpenCode | `.agents/skills/` and `AGENTS.md` | Native shared skill path; see [OpenCode Agent Skills](https://opencode.ai/docs/skills/) |
| GitHub Copilot | `.agents/skills/` and `AGENTS.md` | Supported project skill path; see [GitHub Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |
| Claude Code | `.claude/skills/` and `CLAUDE.md` | Generated compatibility files; see [Claude Code skills](https://code.claude.com/docs/en/skills) |

Trellis tests manifest detection and command dispatch for generic,
JavaScript/TypeScript, Python, Go, and Rust projects. See
[language support](docs/language-support.md) for the boundary between tested
automation and manual integration.

## Understand a repository cheaply

Start with the read-only core map:

```bash
trellis map
trellis map --json
```

It summarizes manifests, stacks, top-level composition, tests, and documented
systems without writing a cache. Enable Graphify only for deeper symbol and
dependency traversal, or Bounds for reviewed subsystem ownership and boundary
enforcement. Enablement is atomic and project-wide:

```bash
trellis config show
trellis config enable graphify
trellis config enable bounds
```

Enabling does not install either tool and makes missing setup a blocking check.
See [repository mapping and optional tools](docs/repository-mapping.md) for exact
installation, CI, verification, and removal commands.

## Install

The current distribution is a source checkout. It is not advertised as an npm
registry release.

```bash
git clone https://github.com/Farzin312/trellis.git
cd trellis
npm install -g .
trellis --version

trellis new my-project
cd my-project
npm run check
```

`npm install -g .` exposes the `trellis` executable from the checked-out source.
If you do not want a global link, invoke `node .trellis/cli.mjs` from the source
checkout instead.

To configure a checkout that already contains Trellis:

```bash
trellis init "My Project" --stack=typescript
```

For an unrelated existing repository, follow the
[brownfield adoption guide](docs/adopting-existing-projects.md). Trellis does
not overwrite an existing mandate, package script, CI workflow, or agent setup
to automate that merge.

Add `--with-graphify` or `--with-bounds` only when you want that integration to
become a project-wide requirement; these flags enable but do not install it. Run
`trellis help --ai` for the exact current CLI contract.

## First successful workflow

Open the generated project in a compatible agent and ask it to use the first
SDD skill:

```text
Use the speckit-specify skill to specify: Add a password reset flow.
```

That wording is portable. Native shorthand differs by agent (`$skill` in
Codex, `/skill` in Claude Code and Copilot CLI, and the skill tool or a direct
request in OpenCode); see [Agent Skills](docs/skills.md).

Continue in this order:

```text
Specify -> Clarify -> Plan -> Tasks -> Checklist -> Analyze -> Implement -> Review -> Verify
```

Each phase has a canonical skill under `.agents/skills/speckit-*/SKILL.md`.
Finish by running:

```bash
npm run check
```

A successful run has no required failures. Optional `SKIP` or `WARN` results
remain visible and are not counted as passed evidence.

## Troubleshooting

- **`trellis` is not found:** from the Trellis source checkout, rerun
  `npm install -g .`, or use `node .trellis/cli.mjs`.
- **A configured integration fails:** follow the next action printed by
  `trellis check`; configured-but-missing tools are failures.
- **An unconfigured integration is skipped:** configure it only if the project
  needs it. A skip is expected, not a pass.
- **The target directory already exists:** choose a new directory for
  `trellis new`. Brownfield adoption requires a reviewed merge.
- **Machine-readable output is needed:** append `--ai` or set `TRELLIS_AI=1`.

The documentation map is at [docs/README.md](docs/README.md).

## License

Trellis is licensed under the [MIT License](LICENSE). Redistributed copies or
substantial portions must retain the copyright and permission notice. Optional
third-party integrations keep their own licenses; Phoenix is distributed under
the Elastic License 2.0 and is source-available rather than OSI-certified open
source. See [credits and licenses](docs/credits.md).

## Security

Report path traversal, command execution, secret exposure, unsafe overwrite, or
gate-bypass concerns through the [security policy](SECURITY.md). Do not place
sensitive reproduction details in a public issue.

## Contributing

Read [the contribution guide](docs/contributing.md), run `npm run check`, and
review the [changelog](CHANGELOG.md) before submitting a focused pull request.
Historical fixes and active specifications are
maintainer evidence, not setup instructions; the documentation index routes to
both deliberately.
