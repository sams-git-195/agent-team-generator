# Template: `AGENTS.md` (+ `CLAUDE.md`)

`CLAUDE.md` is exactly two lines (plus optional project-specific extras the user asks for):

```markdown
@AGENTS.md
@.agents/rules/claude-agent-protocol.md
```

`AGENTS.md` template below. Fill from the interview; delete sections with nothing real to say —
**an empty or guessed section is worse than no section**. Keep it dense and factual: this file is
loaded into every session of every tool, so every line must earn its context cost. Gotchas are
seeded from the interview and grow over the project's life (the PM appends when a convention
changes or a trap is discovered).

---

```markdown
# {PROJECT_NAME} — Agent Guide

## Product context
- {ONE_LINE_PITCH — what it is, for whom, vs. what alternative}
- Personas: {PERSONA_LIST — **Name** (age/role, one-line goal) each}
- Targets: {SUCCESS_TARGETS or omit line}

## Agent team
| Agent | Owns | Hands off to |
|---|---|---|
| project-manager (MAIN session, not a subagent) | Plans, task breakdown, dispatch, `documentation/**`, `AGENTS.md`, roadmaps | all agents |
{ROSTER_ROWS — one per subagent: | name | owned paths/responsibilities | next role |}

One agent edits a shared file at a time — the project-manager sequences tasks so owners never
collide. Claude Code: the main session IS the project-manager (see
`.agents/rules/claude-agent-protocol.md`); the other agents live in `.claude/agents/*.md`.
OpenCode: same team in `.opencode/agent/*.md`, project-manager is the primary agent. When a
convention changes, update both sets together.

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
rules; git policy one-liner. Bold the trap, then one line of why.}

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
- Colors: {PALETTE} · Font: {FONTS} *(if undecided in the interview: `⚠️ undecided — set before
  first UI work`; never invent a palette)*
- {UI_CONVENTIONS — class-merge helper, toast library, icon set, breakpoints to verify (375/768/1440)}

## {DATA_LAYER_SECTION_NAME, named for the platform, e.g. "DB & Firestore" — omit if no backend}
{DATA_RULES — migration conventions, RLS defaults, publication/realtime traps, least-privilege
notes, deploy commands that need explicit go-ahead}

## Documentation
Plain-English living docs in `documentation/` (see protocol §4): `README.md` index +
`pages/<page>.md` + `features/<feature>.md`. Updated by the project-manager before any feature
is Done; qa-tester verifies. Written for humans and future model sessions with zero context.
```
