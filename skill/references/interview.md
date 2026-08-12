# Interview question bank

Run the interview in phases, one topic per message, using AskUserQuestion where options are
enumerable and free text otherwise. Skip anything already answered by the user's opening message
or discoverable from an existing repo (read first, then ask only the gaps). After the interview,
propose the roster (SKILL.md Step 2 — the authoritative list of what the proposal contains)
before generating anything.

## Phase 1 — Product

1. Project name and one-line pitch. What does it do, for whom?
2. Domain / product type (marketplace, SaaS, internal tool, static site, mobile app…).
3. User personas — 1–3 named personas with a one-line goal each (these go into AGENTS.md and the
   product-specialist's Domain Reference).
4. Success targets, if any (GMV, users, conversion — optional; include only if given).
5. Initial pages/routes (3–5), if known — used to seed `documentation/pages/`. "Not decided yet"
   is a fine answer; seed only the README in that case.

## Phase 2 — Tech stack

Ask as a grid; every answer parameterises ownership maps and gotchas.

1. Frontend: framework + version (React 18? Vue? none?), build tool, styling (Tailwind version
   matters: v4 = CSS-first, no config file), component library, and — if decided — brand
   palette + fonts (feeds AGENTS.md §UI; "undecided" gets a ⚠️ marker, don't invent one).
2. Backend/data: Supabase/Firebase/custom API/none; database; where server logic lives
   (Edge Functions, API routes, none).
3. Auth: provider and pattern (client-side hook? middleware? roles table?).
4. Payments/money: Stripe/none/other. **If money exists, it is automatically a risk surface** and
   the money-module convention applies (pure functions in one file, integer minor units, tests).
5. i18n: locales and file locations, interpolation syntax — or "none".
6. Hosting/deploy: platform + how deploys are triggered, and which commands agents must never run
   unprompted.
7. Testing: runner, what coverage exists, whether component/E2E testing is available.
8. Dev commands: dev / build / lint / typecheck / test — exact npm scripts (these become the
   quality gates verbatim).
9. Mobile/native or other platforms in scope?

## Phase 3 — Risk surfaces

"What is expensive to get wrong in this project?" Offer the common set as multi-select, plus
free text: money/commission math · auth/permissions/RLS · timezones/scheduling · migrations on a
live DB · third-party integrations (name them) · PII/compliance · realtime/concurrency.
The answers drive: the protocol's "think hardest" list, the model-escalation triggers, the
qa-tester's extra-scrutiny checklist, and the risk-register template rows.

## Phase 4 — Business rules

Free text: pricing/commission tables, cancellation/refund policies, expiry rules, limits,
anything with a number in it. Encode them as tables in AGENTS.md §Business rules. Anything the
user can't answer yet goes in AGENTS.md as an explicit `⚠️ undecided` marker, never a guess.

## Phase 5 — House rules

1. Specific rules and recommendations, verbatim (they go into AGENTS.md gotchas and, where
   behavioural, into the protocol).
2. Anything agents must NEVER do in this project — every deploy/DB-push/dangerous command named
   here goes verbatim into the protocol §6 and the OpenCode `deny` lists.

Do NOT ask about git policy — it is fixed (protocol template §6): commit freely; push/PR only
when the user says so or after asking; deploys and DB pushes never without being told.

## Phase 6 — OpenCode models

1. Which OpenCode provider/models are available for this project?
2. Ask the model **per agent** (not per tier): one pin for each subagent role, plus
   `reasoning_effort` per model if the provider supports it. Default `temperature: 0.1`.
   **The project-manager gets NO model pin** — as the primary agent it uses OpenCode's
   standard model selector.
3. Claude Code side: default matrix is sonnet for product-specialist, opus for
   architect/developers/qa, with escalation triggers from Phase 3 (see protocol template §3).
   Confirm or adjust.

## Phase 7 — Roster confirmation

**7.0 — Builder split (always ask first, AskUserQuestion).** If the project has both a
server/data layer and a UI, ask before proposing the roster:

> Do you want separate **backend-developer + ui-ux-developer** agents (recommended — they can
> be dispatched in parallel and each carries a tighter contract), or a single
> **fullstack-developer** (simpler roster, but backend and UI tasks queue behind one agent)?

Separate devs is the recommended default. A fullstack choice uses
`templates/fullstack-developer.md` INSTEAD of the two builder templates — union of ownership,
both rule sets kept. Projects with no server/data layer skip this question (see adaptations
below). Then:

Propose the adapted roster with a one-line justification per change from the core six
(product-specialist, architect, project-manager[main], backend-developer, ui-ux-developer,
qa-tester). Typical adaptations:

- No backend/data layer → drop backend-developer; ui-ux-developer becomes `developer`.
- User chose a single dev in 7.0 → `fullstack-developer` from its template (note: loses the
  parallel-dispatch benefit; say so).
- Expo/React Native in scope → add `mobile-developer` with its own ownership paths.
- Heavy infra/CI work → add `devops-engineer`.
- Data pipelines/analytics → add `data-engineer`.

Present the file-ownership map (which role owns which globs, what's shared and must be
sequenced) together with the model matrix from Phase 6 — SKILL.md Step 2 defines the full
proposal contents — and get explicit approval before writing files.

## Phase 8 — Initialisation recommendations (greenfield only)

When the target repo has no code yet, recommend — and scaffold only after approval:

1. **Quality-gates setup**: linter config, a real typecheck script, test-runner wiring — so the
   gate commands quoted throughout the generated files exist from day one.
2. **CI workflow**: a PR-only pipeline running every gate as a separate step (so one run
   reports every failure), shaped so the jobs can be marked required status checks.
3. **Env hygiene**: `.env.example` documenting every env location, `.env` git-ignored, and the
   no-secrets-in-client-shipped-vars rule wired into AGENTS.md gotchas.

Present these as a short menu with what each creates; the user picks. Skip the phase entirely
on repos that already have code.

## Phase 9 — Optional skill add-ons (all repos)

Offer the recommended third-party skills below (AskUserQuestion, multi-select). For each one
the user wants, ask a follow-up: **project level** (this repo only) or **user level** (all
their projects)? Run the matching install command only after they choose; verify the skill
directory exists afterwards and report the path. If an install command fails, report the
error verbatim and move on — never block generation on an add-on.

| Add-on | What it does | Project-level install | User-level install |
|---|---|---|---|
| **UI/UX Pro Max** ([repo](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)) | Design intelligence: generates design systems, UI styles, palettes, stack-specific code | `npm install -g ui-ux-pro-max-cli` then `uipro init --ai claude` (run in the project root) | `npm install -g ui-ux-pro-max-cli` then `uipro init --ai claude --global` |
| **Animation Principles** ([repo](https://github.com/dylantarre/animation-principles)) | Motion/animation guidance organised by skill level | `npx skillfish add dylantarre/animation-principles 04-by-skill-level --project` | `npx skillfish add dylantarre/animation-principles 04-by-skill-level --global` |

Notes: `npm install -g` is machine-wide either way (it's the CLI, not the skill) — say so when
asking. Both add-ons are most useful on projects with a UI; if the project has no frontend,
still offer them but say they likely won't trigger. Record what was installed (and at which
level) in the hand-over summary. This table is meant to grow — add rows as new add-ons prove
useful.
