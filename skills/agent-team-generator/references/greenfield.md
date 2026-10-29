# Greenfield initialisation (repos with no code yet)

Recommend — and scaffold only after approval, in SKILL.md Step 5. The bar is
**production-ready from the first commit**: strict configs are near-free on day one and
near-impossible to retrofit, so strict is the default and loosening is the deviation that
needs a reason. Skip entirely on repos that already have code.

1. **Quality gates (strict by default)** — this stack's row of the hygiene table in
   `engineering-standard.md`: typechecker, linter, formatter check and test runner, each its
   own script. For every stack:
   - the typechecker in its strictest mode (TypeScript: `strict: true` + `noUncheckedIndexedAccess`,
     `noUnusedLocals`/`noUnusedParameters`; Python: `mypy --strict` or pyright strict; Rust:
     `clippy -D warnings`; Go: `vet` + `staticcheck`);
   - the linter bans the language's escape hatch mechanically and runs zero-tolerance
     (`--max-warnings 0` or equivalent) — a gate passes clean or fails;
   - a formatter with a `format:check` script (or `format-check` where `:` is not allowed);
   - locked installs in CI (`npm ci`, `uv sync --locked`, …) — the hand-over tells the user to
     run the first install and commit the lockfile before CI can pass;
   - the test runner wired **with one real passing test committed** — an empty setup makes
     every later "tests pass" claim vacuously true.
2. **CI on PR AND merge** — `pull_request` and `push` to the main branch (the merge run
   catches semantic conflicts between PRs that were each green alone). Every gate a separate
   step so one run reports every failure. Shape jobs as required status checks; recommend
   branch protection (required checks + no force-push) in the hand-over — a repo setting the
   user clicks, not a file.
3. **Env hygiene** — the stack's env convention: an example env file documenting every
   variable, the real one git-ignored, the no-secrets-in-client-vars rule in AGENTS.md gotchas.
4. **Optional hardening (recommend, don't push)** — toolchain version pinning (`.nvmrc` +
   `engines`, `.python-version`, `rust-toolchain.toml`, `go.mod` toolchain line) with the same
   version in CI · Dependabot/Renovate with grouped minor updates · a coverage floor scoped to
   the risk-surface modules only (blanket floors breed junk tests) · a pre-push hook running
   the gates (CI stays the real gate).

**Every gate runs on every change** — there is no "tests only when money was touched" tier.
This phase may add gates the user's list lacked (typically the format check); whatever is
scaffolded must match `commands.gates` in `team.json` verbatim, so nothing passes locally
that fails in CI. Settle the list before rendering; AGENTS.md carries
`⚠️ verify scripts exist after first scaffold` until the manifest exists, then the marker goes
and the verifier is re-run.
