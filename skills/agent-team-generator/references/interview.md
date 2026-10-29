# Interview — one intake message, a summary to correct, then the gates

Ask with the harness's question tool when it has one (Claude Code: AskUserQuestion), else a
numbered list in chat. Never ask what Step 0 already read from the repo; show it as a row to
confirm instead.

## 1. Intake (one message)

Ask for a single paragraph, in the user's words, covering:

> What the product is and for whom (name, one-line pitch, the people who use it) · the stack
> and hosting (frontend, backend/data, auth, payments, i18n, how it deploys) · what is
> expensive to get wrong · any rules with numbers in them (fees, limits, windows) · anything
> agents must never do without being told · the two or three jobs that must be quickest for
> users. Say "undecided" for anything not settled yet.

On a re-run (`.agents/team.json` exists) ask instead: "Here is what the team file says
(summary below) — what changed?"

## 2. Summary table (the user corrects it)

Turn the paragraph plus the survey into one table — one row per `team.json` area — and label
each row's source: **repo** (read from a file: name it) · **you** (from the paragraph) ·
**default** (the skill's recommendation) · **⚠️ undecided**. Rows:

| Row | What goes in it |
|---|---|
| Product | name, pitch, personas, routes (seed `documentation/pages/`; "not decided" seeds only the README) |
| Stack | frameworks + versions, routing library ("undecided" — never assume one), styling, component library, backend/data, where server logic lives, auth pattern, payments, i18n files + interpolation, mobile |
| Commands | dev / build / lint / typecheck / test, the directory each runs from, the single-file test form. Monorepo → root-level proxies (workspace scripts, a `Makefile`) so one command per gate runs from the root; propose them if absent |
| Hygiene | the stack hygiene row(s) from `engineering-standard.md`; secret file(s); client-shipped env prefix; breakpoints (web default 375/768/1440) |
| Risk surfaces | the common set offered as a checklist — money/commission math · auth/permissions/RLS · timezones/scheduling · migrations on a live DB · third-party integrations (named) · PII/compliance · realtime/concurrency — plus free text. Money present ⇒ risk surface, automatically |
| Core flows | the two or three jobs that must be quickest (fills the Usability bar's step budget) |
| Business rules | every number as a table row; unknown → `⚠️ undecided — ask before implementing` |
| House rules | verbatim; behavioural ones go to gotchas |
| Never-do list | every deploy / DB-push / dangerous command, verbatim → protocol §6. Property-based dangers (a CLI's live mode) and environment-targeted ones (a migration whose target is `DATABASE_URL`) are named as prose there, since they cannot be a command prefix |
| Design | direction (audience, tone, palette, fonts, reference sites) or `⚠️ undecided` + "the UI developer proposes a direction before the first screen"; token file; conventions |

**Always confirm explicitly, even if the user says "looks right":** the risk surfaces and the
never-do list. Everything else accepts "looks right" as approval.

## 3. The gates (one question call, several questions)

1. **Harness** — Both Claude Code and OpenCode, kept in line (recommended; detected from
   `.claude/` or `CLAUDE.md` vs `.opencode/` or `opencode.json`) · Claude Code only · OpenCode
   only · Another (name it — Codex, Gemini CLI, Cursor, Copilot…; persona files go to
   `.agents/agents/` with a pointer file where known; dispatch mechanics marked `⚠️ verify`).
   A legacy `.opencode/agent/` directory or v1 `permission:` map is reported as "v1 layout —
   will be replaced by the v2 layout".
2. **Builder split** (projects with both a server/data layer and a UI) — separate
   backend-developer + ui-ux-developer (recommended: parallel dispatch, tighter contracts) ·
   a single fullstack-developer (simpler; backend and UI tasks queue behind one agent — say
   so). No server/data layer → no question: drop backend-developer; ui-ux-developer may be
   renamed `developer`.
3. **Report style** — Technical (every file and decision; full gate output) · Direct with
   technical summary (recommended: files touched with a one-line reason; gate names with
   pass/fail, failures quoted) · Plain English (product-level, no file paths; "gates passed"
   or the failure in words). The shape is fixed (protocol §7); this sets depth only.
4. **Security review** — yes (recommended): protocol §5 references `/security-review` on
   Claude Code and, with OpenCode, a generated `.opencode/commands/security-review.md` runs
   under qa-tester.
5. **Design skill** (projects with a UI) — `frontend-design` (recommended) · Impeccable ·
   UI/UX Pro Max · none. The team's own Design bar does not depend on any; one deepens it.
   Installed in Step 5 at the level the user picks.

Then, as part of the Step 2 roster proposal: **OpenCode model pins per agent** (when OpenCode
is a target; `provider/model-id#variant`, the variant being the provider's reasoning-effort
level; omit `#variant` when the model has none; no `temperature`) and the Claude Code matrix
(default: sonnet for product-specialist and builders, opus for architect, qa-tester and
code-reviewer; builders step up to opus on the risk surfaces, multi-module changes or a design
decision — confirm or adjust).

Do NOT ask about git/deploy behaviour or permissions: both are fixed (open permissions, the
protocol §6 user-gated list). The never-do list decides only which commands §6 names.

## 4. Greenfield (empty repo only)

Read `greenfield.md` and offer its menu in the same question call as the gates, or right
after. The gate commands it settles go into `commands.gates` before rendering.
