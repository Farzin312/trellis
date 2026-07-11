# Credits and Licenses

> Parent: [documentation index](./README.md)

Trellis separates its license from optional and referenced software. A mention
does not mean a tool is installed, configured, or required.

## Trellis

The `trellis-agent-toolkit` source is licensed under MIT. See
[the scoped Trellis license](../.trellis/LICENSE). Redistributed copies or substantial portions must retain
the copyright and permission notice.

The core Node CLI has no runtime package dependency. Development tools and
optional integrations retain their own licenses.

## Optional integrations

| Project | How Trellis relates | License |
|---|---|---|
| [Graphify](https://github.com/safishamsi/graphify) | Explicit opt-in code graph integration; installed separately | MIT |
| [Bounds](https://github.com/Farzin312/bounds) | Explicit opt-in boundary integration; installed separately | MIT |
| [Arize Phoenix](https://github.com/Arize-ai/phoenix) | Optional bundled Docker Compose service; instrumentation is project-owned | Elastic License 2.0 |

Phoenix is licensed under Elastic License 2.0 and is source-available, not
OSI-certified open source. Its license restricts some hosted-service and license
key circumvention uses; consult the upstream license for the operative terms.

## Standards and referenced work

| Project or standard | Use |
|---|---|
| [Agent Skills](https://agentskills.io/) | `SKILL.md` structure used by canonical `.agents/skills/` sources |
| [AGENTS.md](https://agents.md/) | Durable cross-agent repository guidance convention |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Inspiration for the spec-driven phase model |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Related repository-native specification workflow considered in product positioning |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | Optional external simplicity posture referenced by review guidance; MIT |

Platform products and their terms are not bundled with Trellis. Compatibility
links and the review date live in [skills.md](./skills.md).
