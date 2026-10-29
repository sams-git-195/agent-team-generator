# Engineering standard — what fills `stack.*`

The behavioural rules (senior ladder, floor, the seventeen-point standard, red flags) are
encoded once in `templates/protocol.md` §2 and echoed in every builder through the
`grounding` partial; nothing here is pasted anywhere. This file exists for two things the
model must judge per project: the **over-engineering contrast** (what the ladder removes) and
the **stack hygiene table** that fills `stack.hygiene_rule`, `stack.hygiene_check`,
`stack.env_convention`, `stack.unsafe_render_apis` and `stack.debug_print` in `team.json`.

**The ladder, in one line** (so you can recognise it in generated files): does it need to
exist → already in this codebase → an installed dependency does it → one line → only then the
minimum — never below the floor of error handling, graceful user-facing failures, every state
and the full ask.

**Over-engineering, for contrast:** an abstraction with one caller · a config option nobody
sets · a wrapper around a library that adds nothing · a generic solution to one concrete case
· a new file where three lines in an existing one do · defensive checks for states the types
already rule out.

## Stack hygiene table

Pick the row(s) for this stack; two languages → two rows merged into each field (see
`fixtures/team.json`, TypeScript + Python). "Other" means ask the user the five questions in
that row and fill from the answers. `greenfield.md` uses the gates column.

| Stack | `hygiene_rule` | Greenfield gates (each a separate script + CI step) | `env_convention` | `unsafe_render_apis` | `debug_print` |
|---|---|---|---|---|---|
| **TypeScript / JS** | `strict: true`; zero `any` (`no-explicit-any` as an error); no non-null `!` without a comment | `tsc --noEmit` · type-aware ESLint with `--max-warnings 0` · `prettier --check` · vitest/jest with one real test | `.env` git-ignored, `.env.example` committed; client-shipped prefix (`VITE_`, `NEXT_PUBLIC_`, `EXPO_PUBLIC_`) never holds a secret | `dangerouslySetInnerHTML`, `innerHTML`, `v-html`, `eval`, `new Function` | `console.log` (intentional `console.error` only) |
| **Python** | full type hints on every public function; no bare `except:`; no mutable default arguments | `pyright` or `mypy --strict` · `ruff check` · `ruff format --check` · `pytest` with one real test | `.env` git-ignored, `.env.example` committed; settings through one typed settings object | `mark_safe`, `Markup`, `\|safe`, `eval`/`exec`, `subprocess(..., shell=True)`, `pickle.loads` on external data | `print` in library code (use `logging`) |
| **Go** | no ignored errors (`_ = err` banned); `errors.Is`/`As`, never string comparison; `context.Context` passed, never stored | `go vet` · `staticcheck` · `gofmt -l` (empty output) · `go test ./...` with one real test | config through one package reading env at startup; `.env.example` only if a loader is used | `template.HTML`/`template.JS`, `unsafe`, `exec.Command` with user input | `fmt.Println` in library code (use `log/slog`) |
| **Rust** | no `unwrap`/`expect` outside tests (use `?` with typed errors); `unsafe` blocks commented | `cargo clippy -- -D warnings` · `cargo fmt --check` · `cargo test` with one real test | config into a typed struct at startup; `.env` git-ignored if dotenv is used | `unsafe`, raw HTML in templates, `Command` with user input | `println!`/`dbg!` in library code (use `tracing`) |
| **Other** | ask: the language's escape hatch, and its lint rule that bans it | ask: typechecker · linter · formatter · test runner | ask: where env lives, what prefix ships to clients | ask: the raw-HTML / eval / shell-injection APIs | ask: the debug-print call |

`hygiene_check` is the same rule as a short self-check phrase ("zero `any`; no `console.log`").
Also stack-dependent, asked in the interview: `stack.breakpoints` (web: 375 / 768 / 1440 px;
native: the two device classes the app targets) and `stack.secret_files` (the local secret
file, e.g. `.env` — readable and editable, never committed or exposed).
