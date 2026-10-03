# Template: `AGENTS.md` (+ `CLAUDE.md`)

`CLAUDE.md` is exactly two lines (plus optional project-specific extras the user asks for):

```markdown
@AGENTS.md
@.agents/rules/claude-agent-protocol.md
```

`AGENTS.md` is the SECOND fenced block in this file — only what is inside that block is
written to the target, starting at its `# … — Agent Guide` heading. Fill from the interview; delete sections with nothing real to say —
**an empty or guessed section is worse than no section**. Keep it dense and factual: this file is
loaded into every session of every tool — main agent and subagents alike — so every line must
earn its context cost. That is also why the "How we work" section lives here: it is the one
place every harness reads without being told to, so the rules that must never be missed (who
leads, what is user-gated, the senior ladder) are stated here in short and expanded in the
protocol. Gotchas are seeded from the interview and grow over the project's life.

---

```markdown
# {PROJECT_NAME} — Agent Guide

## Product context
- {ONE_LINE_PITCH — what it is, for whom, vs. what alternative}
- Personas: {PERSONA_LIST — **Name** (age/role, one-line goal) each}
- Targets: {SUCCESS_TARGETS or omit line}

## How we work
**Full process: `.agents/rules/claude-agent-protocol.md` — read it before your first task.**
(Claude Code loads it through `CLAUDE.md`; every other harness reads it explicitly.) The
short version, which holds even if you read nothing else:

- **The main agent leads.** There is no project-manager agent: the session talking to the
  user plans, dispatches the specialists below, tracks their evidence, and reports back.
  Prefer dispatching. For a small, quick, single-discipline change with no risk surface, the
  main agent may do it directly — after reading that specialist's file and following its
  rules, workflow and self-check.
- **Open permissions, user-gated actions.** Agents may edit any file and run any command the
  task needs, and commit freely. They `git push`, open or merge PRs, deploy
  ({DEPLOY_COMMANDS}), migrate a shared database, edit secret files, or delete/destroy anything **only when the
  user has said so in this conversation** — and when the user has said so, they do it without
  asking again. Not asked yet → finish, commit, and offer the exact command.
- **Stay in your lane.** Each agent focuses on what it owns (table below). A small adjacent
  edit the task needs is fine and gets named in the report; anything larger goes to its owner.
- **Senior ladder before any code:** (1) does this need to exist? (2) is it already in this
  codebase — reuse it; (3) does an installed dependency do it; (4) can it be one line;
  (5) only then the minimum that works — **without** dropping error handling, graceful
  user-facing errors, or any part of the user experience.
- **Evidence, not claims.** Gates are run and their output quoted. Unknown business rules are
  asked, never guessed.
- **Reports to the user:** {REPORT_STYLE} depth, protocol §7 shape (outcome first, structured,
  no preamble).

## Agent team
| Agent | Focus (owns) | Hands off to |
|---|---|---|
| **Main agent** (the session itself — no file) | Plans, dispatch, tracking, small direct changes, `AGENTS.md`, roadmaps | all agents |
{ROSTER_ROWS — one per subagent: | name | owned paths/responsibilities | next role |}
| code-reviewer | Independent review of a diff, on the user's request; logs minor issues to `documentation/known-issues.md` | main agent |

{HARNESS_PARAGRAPH — per interview Phase 0:
 Both: "Claude Code: agents live in `.claude/agents/*.md`, permissions in
 `.claude/settings.json`. OpenCode: the same team in `.opencode/agents/*.md`, permissions in
 `opencode.json`; the main agent is OpenCode's default `build` agent. When a convention
 changes, update both sets together — same roster, same rules, same policy."
 Claude Code only: the first sentence of the above.
 OpenCode only: the second sentence of the above.
 Other: "Persona files live in `.agents/agents/*.md` (harness-neutral). Adopt the matching
 persona before any task; dispatch mechanics for {HARNESS_NAME}: ⚠️ verify."}

## Dev commands
- `{DEV_COMMAND}` — {what it does, port, quirks}
- `{BUILD_COMMAND}` — {output dir}
- `{LINT_COMMAND}` / `{TYPECHECK_COMMAND}` / `{TEST_COMMAND}` — {what's covered, what isn't}
- **Quality gates: {GATES_SENTENCE — which must pass before any task is done; which are
  conditional on what}**

## Critical gotchas
{GOTCHA_BULLETS — seed from interview: exact framework versions and APIs NOT to use; config
styles (e.g. Tailwind v4 = CSS-first, no config file); i18n syntax; missing libraries commonly
assumed present ("react-hook-form is NOT installed — don't import it"); env-file layout; secret
rules. Bold the trap, then one line of why.}

## Architecture
{ARCHITECTURE_BULLETS — app shape (SPA? SSR? routes file), data layer (client singleton,
API pattern), auth/RBAC model, state/query conventions, realtime rules, integration notes.
Concrete file paths for every claim.}

## Business rules
{BUSINESS_RULES — tables for anything with numbers (commission, fees, limits, expiry,
cancellation windows). Mark undecided rules `⚠️ undecided — ask before implementing`.
If money exists: name the single money module, the integer-minor-units rule, and the test
requirement.}

## UI
- **Design direction:** {DESIGN_DIRECTION — audience, tone, the one thing a visitor should
  remember; reference sites if the user named any} *(if undecided in the interview:
  `⚠️ undecided — the UI developer proposes a direction and gets it approved before the first
  screen`; never invent a look screen by screen)*
- Tokens: {DESIGN_TOKEN_SOURCE — where colour/type/spacing tokens live} · Colors: {PALETTE} ·
  Type: {FONTS — display + body pairing}
- {UI_CONVENTIONS — class-merge helper, toast library, icon set, breakpoints to verify (375/768/1440)}
- Generic-looking UI is a defect here: the Design bar in the UI developer's agent file applies
  to every screen, whoever builds it.

## {DATA_LAYER_SECTION_NAME, named for the platform, e.g. "DB & Firestore" — omit if no backend}
{DATA_RULES — migration conventions, RLS defaults, publication/realtime traps, least-privilege
notes, deploy commands that need explicit go-ahead}

## Documentation
Plain-English living docs in `documentation/` (see protocol §4): `README.md` index +
`pages/<page>.md` + `features/<feature>.md` + `known-issues.md`. Updated by whoever makes the
change, confirmed by the main agent before any feature is Done; qa-tester verifies. Written
for humans and future model sessions with zero context.
```
