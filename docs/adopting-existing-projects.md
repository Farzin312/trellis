# Adopting Trellis in an existing repository

> Parent: [documentation index](./README.md)

Trellis deliberately does not merge itself into an unrelated repository with a
single command. Existing `package.json`, agent mandates, CI, test commands, and
documentation have project owners; guessing how to combine them would either
overwrite user work or create a gate that looks active while skipping the real
application.

## Safe merge workflow

1. Create a branch or worktree and make sure unrelated changes are understood.
2. From the parent directory, create a reference scaffold with the stacks the
   repository actually uses:

   ```bash
   trellis new trellis-reference --stack=typescript,python
   ```

3. Compare the reference with the target. Bring over the canonical guidance,
   `.agents/skills/`, `.specify/memory/`, `.specify/templates/`, the portable
   `.trellis/` implementation, and documentation files that do not conflict.
   Exclude `.trellis/config.json`, `.trellis/generated-skills.json`, and
   `.trellis/metrics/`; initialization owns those project-local artifacts. Do
   not copy the reference project's generated identity, `README.md`, root
   license, or package metadata blindly.
4. Merge the Trellis package scripts into the existing `package.json`. Preserve
   the application's real test command as `test:project`, then define one
   `check:project` script that runs every blocking application gate, for example
   lint, build, type checks, `test:project`, migration checks, and browser tests.
   Trellis uses `test` for its evidence runner and `check` for the repository
   aggregate. Never call either wrapper from `check:project`; that is recursive.
   If the project already owns these script names, choose and document an
   intentional merge before continuing.
5. Merge `AGENTS.md` by meaning. Keep one cross-agent mandate. `CLAUDE.md` must
   import `@AGENTS.md` on its first line; Claude-specific instructions may
   remain below the import.
6. Merge `.gitignore` and CI deliberately. The blocking CI contract is
   `npm ci` followed by `npm run check`; keep application evidence behind
   `check:project` so local and CI execution cannot drift.
7. Run initialization only after `.trellis/` and the reviewed package contract
   are present:

   ```bash
   bash .trellis/init.sh "Existing Project" --stack=typescript,python
   npm install --package-lock-only --ignore-scripts
   npm run check
   ```

8. Inspect every `WARN` and `SKIP`. A project test warning means the application
   is not yet part of the blocking evidence contract.

## Conflict rules

- Never replace an existing root license with the Trellis license. Trellis's
  copied implementation remains covered by `.trellis/LICENSE`; the adopting
  project chooses its own license.
- Never enable Graphify or Bounds until their installation and project data are
  ready in developer and CI environments.
- Never replace an existing Git hook automatically. Keep enforcement in the
  aggregate command and CI unless the project explicitly owns a hook merge.
- Do not move application auth, authorization, payment, secrets, or database
  policy into Trellis. Those remain project-owned fail-closed boundaries.

Delete the temporary reference scaffold after the merge is reviewed. It is a
comparison artifact, not a runtime dependency.
