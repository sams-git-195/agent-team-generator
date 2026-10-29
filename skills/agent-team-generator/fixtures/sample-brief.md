# Fixture: canned interview for the application-scenario test

Use this to test the skill itself (DESIGN.md §Testing): dispatch a subagent with ONLY the
skill files, an empty git-initialised temp directory as the target, and this brief as the
user's messages (the skill never reads this file). The subagent runs the skill end to end
without asking questions; anything not covered → "accept the recommended default". The
expected result is a `.agents/team.json` equivalent to `fixtures/team.json` and a clean
render; review the differences as judgment calls, then check the expectations below.

The project is fictional. Nothing here may be copied into a real project by the skill.

## Intake paragraph (the user's one message)

> *Ledgerly* — invoicing for freelance translators; they create invoices in two currencies
> and clients pay by card. Personas: Mara (freelance translator, wants to invoice in 2
> minutes) and Tomás (agency owner, pays 40 invoices a month, wants a single statement).
> Pages: /invoices, /invoices/new, /clients, /settings. Stack: React 18 + Vite + Tailwind v4,
> no component library, design direction undecided, routing library undecided; backend
> Python 3.12 FastAPI + Postgres via SQLAlchemy + Alembic, server logic in
> `api/app/services/`; monorepo `web/` + `api/` with gates from the root via a root
> `package.json` workspace and a root `Makefile`. Auth: session cookies, roles table
> (translator, agency, admin). Payments: Stripe, test mode locally. i18n: en and es, JSON in
> `web/src/i18n/`, `{{var}}` interpolation. Hosting Fly.io, deploy by `fly deploy`; DB
> migrations by `alembic upgrade head` — the same command runs routinely against the local
> DB, production only when I say. Testing: pytest (some coverage), vitest (none yet), no E2E.
> Commands: `npm run dev` (5173), `npm run build`, `npm run lint`, `npm run typecheck`,
> `npm run test`; `make lint` (ruff), `make typecheck` (pyright), `make test` (pytest).
> Expensive to get wrong: money/currency math, auth/permissions, migrations on the live DB,
> the Stripe integration. Rules: platform fee 2.5 % of the invoice total, minimum 50 minor
> units, rounded half-up; amounts stored as integer minor units in the invoice currency; FX
> rate captured at invoice creation, never recomputed; refund window undecided. Never call
> Stripe outside `api/app/services/payments.py`; never `fly deploy`, `alembic upgrade head`
> against prod, or the `stripe` CLI in live mode without my say-so. Quickest jobs: create
> invoice → send; open statement → pay 40 invoices. Local secrets in `.env`.

## Gate answers

Harness: both. Builder split: separate. Report style: Direct with technical summary.
Security review: yes. Design skill: frontend-design (user level). Greenfield menu: strict
gates for both rows, CI on PR + merge, env hygiene, version pinning only. OpenCode pins:
product-specialist and builders `anthropic/claude-sonnet-5-5`, judges
`anthropic/claude-opus-5-5#high`. Claude Code matrix: defaults. Roster: the core six.

## Expectations (after `render-team.js` reports a clean verify)

- `AGENTS.md`: the 2.5 % / 50-unit table and a `⚠️ undecided` refund row; How we work names
  `fly deploy` and `alembic upgrade head` against production; §UI carries the undecided
  direction marker and the frontend-design line; the main agent's row lists the root
  `package.json` and `Makefile`.
- No project-manager file. Both agent sets, six roles each, `.opencode/agents/` (not
  `agent/`), every OC file `mode: subagent` with a `provider/model` pin, no `name:`, no
  `permissions:`, no `tools:` in any CC file. `opencode.json` is the single allow-all rule;
  `.claude/settings.json` allows `Bash`, `Edit`, `Write`, `WebFetch`, `WebSearch`.
- Protocol §6 names the three gated commands and says to carry a gated action out without
  re-asking; §3's matrix has sonnet builders with a step-up column and opus judges; §5 says an
  S task off a risk surface relies on self-QA.
- backend-developer carries the Python + TypeScript hygiene rule, the money module and the
  Alembic rule; ui-ux-developer carries the full Design and Usability bars with the two core
  flows; qa-tester's checklist has four risk-surface blocks; code-reviewer diffs against
  `main`.
- `.env` is readable and editable, never on the user-gated list. `documentation/pages/` has
  four docs, `/invoices/new` as `invoices-new.md`; `.opencode/commands/security-review.md`
  exists with `agent: qa-tester`.
- The hand-over lists the refund-window and design-direction markers and says nothing is
  blocked mechanically.
