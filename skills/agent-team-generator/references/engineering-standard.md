# Engineering standard — language-agnostic, embedded once

The Fable playbook says how an agent *works* (plan, read, evidence, no guesses). This file says
what the *code* must look like when it is done, in terms that hold for any language. Embed it
into the generated protocol §2 under "Engineering standard" (adapted to the stack, not
referenced — the file won't exist in the target project), and have every builder's Grounding
Rules point at that section with one line. Do not paste all twelve rules into every agent
file — the facts live in the protocol. The **senior ladder** is the exception: it is short,
and every builder template carries it verbatim, because it is the rule a mid-level model
drops first.

Templates hold JS-free placeholders for the language-specific parts; the **stack hygiene
table** at the bottom fills them.

## The senior ladder (climb it before writing any code)

What an experienced senior developer asks, in this order. Stop at the first rung that answers.

1. **Does this need to exist at all?** A speculative need — "might be useful later", an
   option nobody asked for — is skipped, and the report says so in one line.
2. **Is it already in this codebase?** A helper, util, type, component, or pattern that
   already lives here is reused. Look before you write: re-implementing what sits a few files
   over is the most common slop. Grep for it; name what you found.
3. **Does an already-installed dependency solve it?** Use it. Never add a new dependency for
   what a few lines can do.
4. **Can it be one line?** Then it is one line.
5. **Only then:** the minimum code that works as intended.

**The floor — "minimum" never goes below this.** Clean is not the same as thin. The ladder
removes code nobody needs; it never removes what a user or an operator needs:

- **Error handling stays.** Every call that can fail has its failure handled where it can be
  acted on. Fewer lines by deleting a `catch`, a validation, or a timeout is a defect.
- **Failures are loud in the code and graceful on screen.** Log or raise with context for the
  developer; show the user a plain message that says what happened and what to do next, with
  a retry where a retry can work, and without losing what they typed.
- **The user experience is not reduced.** Loading, empty, error and success states;
  disabled-while-submitting; confirmation before the irreversible; keyboard and screen-reader
  access. A shorter diff that drops one of these is not simpler — it is unfinished.
- **The full ask is delivered.** Every acceptance criterion, every role, every edge case the
  spec names. Cutting scope is the user's call; say what you would cut and why, never cut
  silently.

Over-engineering, for contrast, is: an abstraction with one caller · a config option nobody
sets · a wrapper around a library that adds nothing · a generic solution to one concrete case
· a new file where three lines in an existing one do · defensive checks for states the types
already rule out.

## The standard (twelve rules, each checkable)

1. **Climb the senior ladder first; then the smallest correct change.** Three similar lines
   beat a premature helper. Extend the existing pattern before inventing one.
2. **Boundaries are explicit.** Validate at the edge — request, form, file, env, third-party
   response — and trust nothing that crossed one. Inside the boundary, assume validated; do
   not re-check at every layer.
3. **Errors fail loudly in code, gracefully for the user.** Never swallow an error. No silent
   fallback or default for missing data. Every raised error carries context (what was
   attempted, which id). At the UI edge it becomes a clear, actionable message — never a raw
   stack trace, never a blank screen. Retries only for idempotent operations, bounded, with
   backoff; every network call has a timeout.
4. **Risky logic is pure, named, and tested.** Logic on a risk surface ({RISK_SURFACES}) lives
   in pure functions with intention-revealing names. Write the failing test first, then the
   code. Run the narrowest test, then the full suite — both outputs pasted.
5. **Types are the strongest the language offers.** {LANGUAGE_HYGIENE_RULE}. Any escape hatch
   (untyped value, unchecked cast, ignored error, suppressed lint) carries a comment stating
   why it is safe here. Make invalid states unrepresentable where the type system allows.
6. **Names say intent; functions do one thing.** No dead code, no commented-out code, no
   `TODO` without context and owner. Match the surrounding style; do not reformat what you
   didn't change. Comments say why, never what.
7. **Dependencies are deliberate.** Ladder rung 3 first. A new one is flagged in the report
   with the reason an installed one could not do it; versions pinned; lockfile committed;
   nothing pasted from the web without reading and understanding it.
8. **Secrets and config never live in code.** Never in client-shipped bundles or logs.
   {ENV_CONVENTION}. Config is read once at startup into a typed structure.
9. **Logging is structured and at boundaries.** Log entries, exits, and failures of external
   calls; ship no debug prints ({DEBUG_PRINT}); never log secrets or personal data.
10. **Mutations are safe to retry.** Uniqueness via constraints, not application checks; no
    read-modify-write without a transaction or lock; webhooks and jobs idempotent by key.
11. **Tests can fail.** A test asserts behaviour a user or caller depends on, not that a mock
    was called. For new risk-surface logic, prove it: change one value in the code, watch the
    test go red, change it back. A test that stays green is not a test.
12. **Done means verified.** One logical change per commit, message says why. Every gate run
    with output pasted; full `git diff` read as a hostile reviewer; the role's verdict line
    closes the report. Code written ≠ done.

## Stack hygiene table (fills the placeholders)

Pick the row(s) for this stack. A project with two languages gets two rows merged. "Other"
means ask the user the five questions in that row and fill from the answers.

| Stack | `{LANGUAGE_HYGIENE_RULE}` | `{GREENFIELD_GATES}` (each a separate script + CI step) | `{ENV_CONVENTION}` | `{UNSAFE_RENDER_APIS}` | `{DEBUG_PRINT}` |
|---|---|---|---|---|---|
| **TypeScript / JS** | `strict: true`; zero `any` (`no-explicit-any` as an error); no non-null `!` without a comment | `tsc --noEmit` · type-aware ESLint with `--max-warnings 0` · `prettier --check` · vitest/jest with one real test | `.env` git-ignored, `.env.example` committed; client-shipped prefix (`VITE_`, `NEXT_PUBLIC_`, `EXPO_PUBLIC_`) never holds a secret | `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, `eval`, `new Function` | `console.log` (intentional `console.error` only) |
| **Python** | full type hints on every public function; no bare `except:`; no mutable default arguments | `pyright` or `mypy --strict` · `ruff check` · `ruff format --check` · `pytest` with one real test | `.env` git-ignored, `.env.example` committed; settings through one typed settings object | `mark_safe`, `Markup`, `\|safe`, `eval`/`exec`, `subprocess(..., shell=True)`, `pickle.loads` on external data | `print` in library code (use `logging`) |
| **Go** | no ignored errors (`_ = err` banned); `errors.Is`/`As`, never string comparison; `context.Context` passed, never stored | `go vet` · `staticcheck` · `gofmt -l` (empty output) · `go test ./...` with one real test | config through one package reading env at startup; `.env.example` only if a loader is used | `template.HTML`/`template.JS`, `unsafe`, `exec.Command` with user input | `fmt.Println` in library code (use `log/slog`) |
| **Rust** | no `unwrap`/`expect` outside tests (use `?` with typed errors); `unsafe` blocks commented | `cargo clippy -- -D warnings` · `cargo fmt --check` · `cargo test` with one real test | config into a typed struct at startup; `.env` git-ignored if dotenv is used | `unsafe`, raw HTML in templates, `Command` with user input | `println!`/`dbg!` in library code (use `tracing`) |
| **Other** | ask: the language's escape hatch, and its lint rule that bans it | ask: typechecker · linter · formatter · test runner | ask: where env lives, what prefix ships to clients | ask: the raw-HTML / eval / shell-injection APIs | ask: the debug-print call |

Also stack-dependent, asked in interview Phase 2 rather than tabled: `{BREAKPOINTS}` (web:
375 / 768 / 1440 px; native: the two device classes the app targets), `{SECRET_FILES}` (the
file agents must never edit, e.g. `.env`), and the package managers present (drive the
install rows in `permission-policy.md`).
