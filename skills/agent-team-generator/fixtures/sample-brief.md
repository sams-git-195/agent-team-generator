# Fixture: canned interview for the application-scenario test

Use this to test the skill itself (DESIGN.md §Testing): dispatch a subagent with ONLY the
skill files, an empty git-initialised temp directory as the target, and this brief as the
user's answers. The subagent runs the skill end to end without asking questions (every
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
- **Phase 2 — Stack:** Frontend React 18 + Vite + Tailwind v4, no component library, palette
  undecided. Backend Python 3.12 FastAPI + Postgres via SQLAlchemy + Alembic migrations, server
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
  secret file `.env` (only `.env.example` editable); breakpoints 375/768/1440.
- **Phase 3 — Risk surfaces:** money/currency math · auth/permissions · migrations on a live
  DB · Stripe integration.
- **Phase 4 — Business rules:** platform fee 2.5% of invoice total, minimum 50 minor units of
  the invoice currency, rounded half-up; amounts stored as integer minor units in the invoice
  currency; FX rate captured at invoice creation, never recomputed; refund window
  ⚠️ undecided.
- **Phase 5 — House rules:** 5.1 "Never call Stripe outside `api/app/services/payments.py`."
  5.2 Never: `fly deploy`, `alembic upgrade head` against prod, `stripe` CLI in live mode.
  5.3 Permission tier: **Standard**, plus `"stripe *": ask`. 5.4 PM style: **Direct with
  technical summary**.
- **Phase 6 — Models:** OpenCode provider is `anthropic`; pins: product-specialist
  `anthropic/claude-sonnet-5`, everyone else `anthropic/claude-opus-5`. Claude Code matrix:
  defaults.
- **Phase 7 — Roster:** 7.0 separate backend-developer + ui-ux-developer. Core six, no
  additions.
- **Phase 8 — Greenfield init:** the target is empty, so: strict gates for both rows, CI on
  PR + merge, env hygiene — yes to all; hardening items: version pinning only.
- **Phase 9 — Add-ons:** none. Security review: yes, generate the OpenCode command.

## Expectations (review after `verify-team.js` passes)

- `AGENTS.md` business rules carry the 2.5% / 50-cent table and a `⚠️ undecided` refund row.
- Both agent sets exist; CC roster == OC roster minus PM; OC PM is `mode: primary`, no model.
- Every OC file's bash block is the Standard tier with `"fly deploy*": deny`,
  `"alembic upgrade*": ask` (env-targeted, local form is routine), `"stripe *": ask` plus
  `"stripe --live*": deny`; ask-type adjustments sit in the ask band, deny-type in the deny
  band; `.claude/settings.json` carries the same.
- backend-developer's hygiene rule is the **Python** row (type hints, no bare `except`, no
  `print`), ui-ux-developer's is the **TypeScript** row (zero `any`, no `console.log`).
- Protocol §2 embeds the engineering standard; §7 says "Direct with technical summary".
- Ownership: `api/**` vs `web/**` disjoint; qa-tester owns test globs only.
- Money rule names one module under `api/app/services/` and integer minor units.
- `documentation/pages/` has four page docs; `.opencode/command/security-review.md` exists
  with `agent: qa-tester` and names the four risk surfaces.
- The hand-over lists: the refund-window marker, the palette marker, "verify `color`
  against the installed OpenCode version", and where the tier is enforced.
