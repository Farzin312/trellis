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
- `npm run check` is the release gate for this repository.
- Graphify, Bounds, and Phoenix are optional integrations. Their absence is not
  described as successful evidence.

Trellis provides workflow and verification infrastructure. It does not
guarantee an agent's output or install application dependencies. Trellis does not configure application authentication. Authentication, authorization, secrets, and money
flows remain the adopting project's responsibility and must fail closed.

## Prerequisites and support

Core use requires:

- Git
- Node.js 20 or newer
- a shell supported by Node and Git
- at least one AI coding agent if you want to run the Agent Skills

Core initialization, help, checks, and documentation verification need no LLM
credential or paid service. Graphify and Bounds additionally require Python
3.10+ and an installer such as `uv` or `pip`; Phoenix requires Docker. Graphify
can index code without an LLM key, while its document extraction features may
require a supported provider credential.

Compatibility reviewed: 2026-07-10.

| Agent surface | Trellis path | Status and source |
|---|---|---|
| Codex | `.agents/skills/` and `AGENTS.md` | Native project paths; see [OpenAI's customization guide](https://developers.openai.com/codex/concepts/customization) |
| OpenCode | `.agents/skills/` and `AGENTS.md` | Native shared skill path; see [OpenCode Agent Skills](https://opencode.ai/docs/skills/) |
| GitHub Copilot | `.agents/skills/` and `AGENTS.md` | Supported project skill path; see [GitHub Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) |
| Claude Code | `.claude/skills/` and `CLAUDE.md` | Generated compatibility files; see [Claude Code skills](https://code.claude.com/docs/en/skills) |

Trellis tests manifest detection and command dispatch for generic,
JavaScript/TypeScript, Python, Go, and Rust projects. See
[language support](docs/language-support.md) for the boundary between tested
automation and manual integration.

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

Add `--with-graphify` or `--with-bounds` only when you want and can satisfy that
integration's prerequisites. Run `trellis help --ai` for the exact current CLI
contract.

## First successful workflow

Open the generated project in a compatible agent and invoke the first SDD skill:

```text
/speckit-specify "Add a password reset flow"
```

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

## Contributing

Read [the contribution guide](docs/contributing.md), run `npm run check`, and
submit a focused pull request. Historical fixes and active specifications are
maintainer evidence, not setup instructions; the documentation index routes to
both deliberately.
