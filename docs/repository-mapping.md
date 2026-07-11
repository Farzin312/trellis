# Repository mapping and optional architecture tools

> Parent: [documentation index](./README.md)

Use the smallest layer that answers the question. Trellis core provides cheap
structural orientation; Graphify adds symbol and dependency traversal; Bounds
adds an owned subsystem map and enforceable boundary checks.

| Need | Tool | Core requirement | Writes project state |
|---|---|---|---|
| What is in this repository? | `trellis map` | Node.js 20+ | No |
| Where is a symbol and what connects to it? | Graphify | Separate Python tool | `graphify-out/` |
| Which subsystem owns this and what may depend on it? | Bounds | Separate Python tool plus reviewed ownership | `.bounds/` |

## Dependency-free structural map

```bash
trellis map
trellis map --json
```

The command scans at most 100,000 accepted files, skips symlinks, dependencies,
build output, VCS data, common environment/private-key/credential files and
dot-directories, metrics, and active specification history, then reports
manifests, configured stacks, aggregate top-level composition, tests,
extensions, and subsystem documents under `docs/systems/`. It never reads more
than 1 MB from configuration or a subsystem index. It is read-only and does not
cache, so it cannot become stale between runs.

This map is structural orientation, not semantic import analysis. It does not
claim that two files depend on one another or that a documented subsystem is
correct.

## Configuration semantics

```bash
trellis config show
trellis config enable graphify
trellis config disable graphify
trellis config enable bounds
trellis config disable bounds
```

Configuration is validated and written atomically. Enabling an integration makes
it a project-wide requirement: `npm run check` will fail wherever the configured
tool or effective setup is missing. Add its installation and setup to CI before
committing enablement. `trellis config` does not install a third-party tool,
create credentials, or delete that tool's artifacts.

`trellis init --with-graphify` and `trellis init --with-bounds` are enablement
shortcuts. They have the same project-wide semantics.

## Graphify

Compatibility was exercised with Graphify 0.9.10 on 2026-07-11. Install the
separately licensed tool explicitly; this pinned command reproduces that tested
contract:

```bash
uv tool install graphifyy==0.9.10
trellis config enable graphify
trellis graph
graphify query "where is request authorization enforced?" --budget 800
npm run check:integrations
```

`trellis graph` runs `graphify update .`, which performs project-root code
extraction without an LLM. Trellis intentionally does not expose a scoped path:
Graphify writes scoped artifacts below that path while the project readiness
gate owns the root `graphify-out/`. Use Graphify directly for an independent
scoped graph that is not the configured project artifact. The integration check
requires the command plus a valid, non-empty
`graphify-out/graph.json`; it also rejects Graphify's pending semantic-update
flag. The artifact schema does not contain reliable commit metadata, so the
check does not claim code freshness. Run `trellis graph` before relying on the
graph.

Graphify's semantic extraction for documents or richer inferred relationships
is a separate upstream workflow and may require a model credential. Consult
[Graphify upstream](https://github.com/safishamsi/graphify) for those options.

To stop requiring Graphify, run `trellis config disable graphify`. Remove the
tool or `graphify-out/` separately only when no user needs them.

## Bounds

Compatibility was exercised with Bounds CLI 2026.6.47 at commit
`a504befeeea7448791538e2a6f8ad1f2259932eb` on 2026-07-11. Bounds had no PyPI
release at that point, so the tested source commit is pinned explicitly. Bounds
is useful only after maintainers define or review real subsystem ownership:

```bash
pipx install "git+https://github.com/Farzin312/bounds.git@a504befeeea7448791538e2a6f8ad1f2259932eb"
trellis config enable bounds
bounds guide
bounds init --root
bounds discover --apply
bounds coverage
bounds preflight --fail-on-unowned
npm run check:integrations
```

Use `bounds list` for the subsystem map, `bounds describe <name>` for a verified
surface, `bounds where <symbol>` to locate ownership, and
`bounds impact <name>` before shared-interface changes. Trellis's readiness check
requires `.bounds/root.yaml`, non-zero complete supported-source coverage, and a
passing `bounds preflight --fail-on-unowned`; command presence alone is not a
pass.

Discovery proposes structure and can be wrong. Review generated subsystem paths,
public surfaces, and dependency rules before treating Bounds as enforcement.
Enabling it before that review intentionally makes the aggregate gate fail.

To stop requiring Bounds, run `trellis config disable bounds`. Trellis leaves
`.bounds/` untouched because it is project-owned architecture data. See
[Bounds upstream](https://github.com/Farzin312/bounds) for newer installation
channels and tool-specific details; upgrade only after reviewing its CLI
contract against this readiness check.
