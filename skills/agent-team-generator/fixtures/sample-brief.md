# Fixture: canned interview for the application-scenario test

Use this to test the skill itself (DESIGN.md §Testing): dispatch a subagent with ONLY the
skill files, an empty git-initialised temp directory as the target, and this brief passed in
as the user's messages (the skill itself never reads this file). The subagent runs the skill end to end without asking questions (every
interview answer is below; anything not covered → "accept the recommended default"). Then
run `scripts/verify-team.js` against the output and review the generated files against the
expectations at the bottom.

The project is fictional. Nothing here may be copied into a real project by the skill.

## Interview answers

- **Phase 0 — Harness:** Both Claude Code and OpenCode, kept in line.
- **Phase 1 — Product:** *Ledgerly* — invoicing for freelance translators; they create
  invoices in two currencies and clients pay by card. Personas: **Mara** (freelance
  translator, wants to invoice in 2 minutes), **Tomás** (agency owner, pays 40 invoices a
  month, wants a single statement). No success targets. Pages: `/invoices`, `/invoices/new`,
  `/clients`, `/settings`.
- **Phase 2 — Stack:** Frontend React 18 + Vite + Tailwind v4, no component library, design
  direction and palette undecided. Backend Python 3.12 FastAPI + Postgres via SQLAlchemy + Alembic migrations, server
  logic in `api/app/services/`; monorepo `web/` + `api/`, gates run from the root through a
  root `package.json` workspace and a root `Makefile`. Routing library: undecided. Auth:
  session cookies, roles table (`translator`, `agency`,
  `admin`). Payments: Stripe (test mode locally). i18n: `en` and `es`, JSON files in
  `web/src/i18n/`, `{{var}}` interpolation. Hosting: Fly.io, deploy by `fly deploy`; DB
  migrations by `alembic upgrade head` against production — never unprompted (the same
  command runs routinely against the local DB, so it is ask, not deny). Testing:
  pytest (backend, some coverage), vitest (frontend, none yet), no E2E. Dev commands:
  `npm run dev` (web, port 5173), `npm run build`, `npm run lint`, `npm run typecheck`,
  `npm run test`; backend `make lint` (ruff), `make typecheck` (pyright), `make test`
  (pytest). No mobile. Languages: TypeScript row + Python row; package managers npm and uv;
  local secret file `.env` (agents may read and update it; `.env.example` documents every variable); breakpoints 375/768/1440.
- **Phase 3 — Risk surfaces:** money/currency math · auth/permissions · migrations on a live
  DB · Stripe integration.
- **Phase 4 — Business rules:** platform fee 2.5% of invoice total, minimum 50 minor units of
  the invoice currency, rounded half-up; amounts stored as integer minor units in the invoice
  currency; FX rate captured at invoice creation, never recomputed; refund window
  ⚠️ undecided.
- **Phase 5 — House rules:** 5.1 "Never call Stripe outside `api/app/services/payments.py`."
  5.2 Never: `fly deploy`, `alembic upgrade head` against prod, `stripe` CLI in live mode.
  5.3 Permission tier: **Autonomous** (the recommended default). 5.4 Report style: **Direct
  with technical summary**.
- **Phase 6 — Models:** OpenCode provider is `anthropic`; pins: product-specialist
  `anthropic/claude-sonnet-5-5`, everyone else `anthropic/claude-opus-5-5#high`. Claude Code
  matrix: defaults.
- **Phase 7 — Roster:** 7.0 separate backend-developer + ui-ux-developer. Core six
  (product-specialist, architect, backend-developer, ui-ux-developer, qa-tester,
  code-reviewer), no additions.
- **Phase 8 — Greenfield init:** the target is empty, so: strict gates for both rows, CI on
  PR + merge, env hygiene — yes to all; hardening items: version pinning only.
- **Phase 9 — Add-ons:** none. Security review: yes, generate the OpenCode command.

## Expectations (review after `verify-team.js` passes)

- `AGENTS.md` business rules carry the 2.5% / 50-cent table and a `⚠️ undecided` refund row;
  its "How we work" section states that the main agent leads, the user-gated rule naming
  `fly deploy` and `alembic upgrade head` against production, and the senior ladder.
- No project-manager file anywhere. Both agent sets exist with the same six roles;
  `.opencode/agents/` (not `agent/`); every OC file is `mode: subagent` with a
  `provider/model` pin (`#high` on the opus agents), no `name:`, no `permissions:`.
- `opencode.json` is the single allow-all rule; `.claude/settings.json` allows `Bash`, `Edit`,
  `Write`, `WebFetch`, `WebSearch` with no ask/deny. No Claude Code agent has a `tools:` line.
- Protocol §6 lists `fly deploy`, `alembic upgrade head` against production, and the `stripe`
  CLI in live mode as user-gated, and says to carry out a gated action without re-asking once
  the user has instructed it. §1 describes dispatch vs do-it-yourself for small changes.
- Every agent file has "Scope & focus" with its lane, hands off to `main agent`, and states
  the user-gated rule. Lanes: `api/**` vs `web/**` distinct; qa-tester writes tests only;
  code-reviewer writes `documentation/known-issues.md` only.
- backend-developer's hygiene rule is the **Python** row (type hints, no bare `except`, no
  `print`), ui-ux-developer's is the **TypeScript** row (zero `any`, no `console.log`). Both
  carry the senior ladder with its floor.
- ui-ux-developer carries the full Design bar; AGENTS.md §UI marks the design direction
  `⚠️ undecided` with "propose a direction and get it approved before the first screen".
- qa-tester and code-reviewer grade on the same five lights as protocol §5; QA fails on any
  🔴 or 🟠. No generated file makes the test run conditional on a risk surface.
- `.env` is described as readable and editable by agents, with its values never committed,
  logged or reported; it is not on the user-gated list.
- The main agent's roster row lists the shared root files (root `package.json`, `Makefile`).
- Protocol §5 carries the security-review paragraph and qa-tester's Security checklist the
  security-review line (the brief said yes to security review).
- code-reviewer defines the five lights, the mutation check, the fix-prompt blocks, and the
  known-issues entry format; `documentation/known-issues.md` is seeded.
- Protocol §2 embeds the senior ladder and the engineering standard; §7 says "Direct with
  technical summary".
- Money rule names one module under `api/app/services/` and integer minor units.
- `documentation/pages/` has four page docs, `/invoices/new` as `invoices-new.md`; `.opencode/commands/security-review.md` exists
  with `agent: qa-tester` and names the four risk surfaces.
- The hand-over lists: the refund-window marker, the design-direction marker, that the
  Autonomous tier blocks nothing mechanically and §6 is the guard, and "verify against the
  installed OpenCode version".
