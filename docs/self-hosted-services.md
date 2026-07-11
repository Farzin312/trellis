# Optional Self-Hosted Service

> Parent: [documentation index](./README.md)

Trellis includes one Docker Compose service definition: Arize Phoenix. It is
optional and is not part of initialization, help, core checks, or Agent Skills.

## Phoenix

Phoenix can receive traces after the adopting project explicitly instruments a
supported application or agent. Starting the container does not instrument
Claude, Codex, OpenCode, Copilot, or application code.

Prerequisites:

- Docker with Compose support
- port 6006 available, or a reviewed compose override
- project-owned OpenTelemetry or Phoenix SDK instrumentation if traces are needed

Commands:

```bash
trellis services status phoenix
trellis services ports phoenix
trellis services start phoenix
trellis services stop phoenix
```

An explicitly requested service action returns non-zero when Docker, the compose
file, the service name, or the Docker operation fails. Use the printed cause and
next action; do not treat an unavailable requested service as a successful skip.

The dashboard is available at `http://localhost:6006` after the container is
healthy.

## License and boundary

Phoenix uses the Elastic License 2.0. It is source-available and free to
self-host subject to that license, but it is not OSI-certified open source.
Review the upstream license before redistribution or hosted-service use.

Trellis manages only the bundled Phoenix compose file. Other memory,
observability, or tracing products are separate project decisions and are not
implied by this command.

## Troubleshooting

- Run `docker info` and `docker compose version` if status fails.
- Run `trellis services ports phoenix` before changing port configuration.
- Inspect `docker compose -f .trellis/services/docker-compose.phoenix.yml logs`
  when the container starts but the dashboard is unavailable.
- Add instrumentation only from Phoenix's current upstream documentation; the
  compose service alone produces no agent trace data.
