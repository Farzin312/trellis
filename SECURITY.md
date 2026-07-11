# Security policy

Trellis processes repository paths, configuration, and local tool output. Treat
unexpected file writes, command execution, secret exposure, path traversal, or
gate bypasses as security issues.

## Supported versions

Security fixes target the current `main` branch and the latest published
release, when one exists. Version `0.1.0` is currently distributed from source;
there is no npm registry release to imply a separate supported channel.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Farzin312/trellis/security/advisories/new).
Do not include credentials, private source, or exploit details in a public
issue. Include the affected command or file, reproduction conditions, impact,
and the smallest safe proof needed to confirm the problem.

For ordinary bugs with no confidentiality or security impact, use the
[public issue tracker](https://github.com/Farzin312/trellis/issues).

## Scope boundary

Trellis does not configure an adopting application's authentication,
authorization, secrets, payments, or deployment. Vulnerabilities in those
project-owned surfaces belong to that project's security process. Problems in
Trellis-generated guidance or checks that could weaken those boundaries are in
scope here.
