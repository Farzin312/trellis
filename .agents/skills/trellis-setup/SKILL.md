---
name: trellis-setup
description: Guide a user through downloading, adopting, and configuring Trellis with mandatory informed choices. Use when the user asks to install, initialize, adopt, bootstrap, or choose Trellis capabilities for a new or existing project.
---

# Guided Trellis setup

This is an informed setup interview, not an unattended installer. One Trellis
core is shipped; Graphify, Bounds, and Phoenix are need-based add-ons, not
lite/pro/full editions.

## Hard gate before mutation

You may inspect the target read-only to ground recommendations. Do not write to
the target, modify project files, install global tools, enable a gate, or create
a repository until:

1. every mandatory answer is explicit;
2. selected add-on benefits and drawbacks have been explained;
3. external-tool policy is resolved independently for every selected add-on;
4. a deterministic setup plan has been shown; and
5. the user gives final approval to execute that plan.

Never infer consent from “use the recommended option.” Recommendations and
authority are separate.

If no Trellis checkout is available, first ask every mandatory question from
the public `docs/AI-SETUP.md` guide. After those answers, get explicit permission
to download the official Trellis source into an OS-temporary directory solely
to validate and render the plan. That temporary planner download is not approval
to mutate the target or install add-ons.

## 1. Collect every answer

From a Trellis source checkout, run:

```bash
trellis setup questions --json
```

Ask the returned questions in Q-ID order, one at a time. Use the listed choices
and explain `why`; for `needs`, include each add-on's benefit and drawback. Do
not silently default a missing answer. Repository evidence can inform a
recommendation, but the user still answers. “None” and “not-yet” are valid
explicit answers where the schema permits them.

When `mode=existing`, skip the conditional target-directory question and omit
that field from the answer object. No other returned decision is optional.

Before accepting `project_gate=configured`, inspect `package.json` and confirm
that `check:project` covers the project's build, lint, type, test, migration,
browser, and integration gates. Before accepting `risk_surfaces=none`, inspect
for auth, payments, personal data, secrets, databases, and deployment code.

Store the completed JSON in an OS-temporary file, never in the target repository
and never with credentials. Run:

```bash
trellis setup plan --answers=<temporary-file> --json
```

If validation fails, return to the named question. Do not bypass or hand-edit
the validator.

## 2. Explain and approve the plan

Summarize:

- core files and project-owned files;
- new versus brownfield path;
- project scope, stacks, trust-sensitive surfaces, and project gate;
- every selected add-on's concrete benefit, maintenance cost, license boundary,
  prerequisites, generated state, and CI obligation;
- every warning, blocking review, and external state change.

Ask for final approval. A refusal or changed answer returns to planning; it is
not partial consent.

## 3. Execute the approved core path

For a new project, run the plan's `trellis new` argument array. For an existing
repository, create a reference scaffold outside the target and follow
`docs/adopting-existing-projects.md`. Brownfield adoption is always a reviewed
merge: preserve its package commands, mandate, README, license, CI, hooks,
documentation, and unrelated changes. Never bulk-copy the reference over it.

Record the approved `project_scope` and `risk_surfaces` in the target's
`AGENTS.md` managed project-context section, or add a clearly marked equivalent
during a reviewed brownfield merge. Configure `check:project` before treating
application evidence as complete.

## 4. Set up only selected add-ons

Execute the plan in order. Each add-on has its own
`external_tool_policy.<need>` value. `install-approved` authorizes only that
capability's prerequisites; `already-installed` means verify, not reinstall,
and `not-selected` forbids unrelated setup.

- Graphify: install the pinned CLI, install its project-scoped generic Agent
  Skill with `graphify install --project --platform agents`, regenerate the
  Claude mirror, enable the gate, build the root graph, then verify it.
- Bounds: install the pinned source commit, initialize and discover a draft,
  review ownership/public surfaces/dependencies, reach complete supported-source
  coverage, pass `bounds preflight --fail-on-unowned`, and only then enable it.
- Phoenix: verify or install Docker using platform-owned instructions, start the
  pinned localhost service, then add project-owned instrumentation. A running
  empty dashboard is not observability proof.

Do not enable Graphify or Bounds early just to make the plan look complete.

## 5. Verify and hand off

Run the plan's focused checks, then:

```bash
npm run check
```

Report required passes, warnings, skips, and external proof separately. A
warning, skip, unconfigured project gate, unreviewed Bounds draft, missing graph,
or uninstrumented Phoenix service remains open. Remove the temporary answer file
you created after the user no longer needs it; do not delete user-owned files.
