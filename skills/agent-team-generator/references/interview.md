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
3. **Agent bash-permission policy (AskUserQuestion — always ask).** Present the recommended
   default and let the user adopt or adjust it. The shape is fixed (allow-by-default with
   ask/deny exceptions); the exception lists are theirs to tune. Recommended default:
   - `"*": allow` — agents run builds, tests, gates, grep, and `git commit` freely.
   - **deny** (can never run): this stack's deploy/DB-push commands · `git push --force`/`-f` ·
     `git reset --hard` · `git clean -fd` · `sudo` · `chmod` · piping downloads into a shell.
   - **ask** (prompts in-flow): `git push` · `gh pr create` (PR creation) · `rm` ·
     package installs (`npm install`, `npx`, `pnpm add`, `yarn add`) · `curl`.
   Rationale to present: irreversible-destructive or environment-changing → deny;
   recoverable-destructive or outward-facing → ask; everything else → allow.
   Offer: **recommended default** / **stricter** (installs + `curl` → deny; add asks for
   `docker *`, `gh *` wholesale) / **looser** (ask list shrinks to `git push` + `gh pr create`
   only) / **custom** (walk the deny and ask lists category by category).
   Then RECOMMEND stack-specific additions the user may not have thought of — only ones that
   exist in this stack: migration deploys (`prisma migrate deploy`, `drizzle-kit push`) ·
   infra (`terraform apply`, `pulumi up`) · publishing (`npm publish`) · container destruction
   (`docker system prune`, `docker volume rm`) · CLIs with live/production modes (Stripe,
   Shopify… — prefer a wholesale `"tool *": ask` per agent-skeleton.md's property-based-danger
   note) · Windows-native deletes (`Remove-Item`, `del`) when the team runs PowerShell.
   The answer becomes `{POLICY_ADJUSTMENT_LINES}` and applies to EVERY OC agent identically —
   one policy for the whole team; per-role bash variation is not offered.

Do NOT ask about git policy — it is fixed (protocol template §6): commit freely; push/PR only
when the user says so or after asking; deploys and DB pushes never without being told. The
Phase 5.3 policy implements this mechanically (`git push`/`gh pr create` = ask, deploys =
deny); the policy question tunes the exception lists, never the git policy itself.

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

When the target repo has no code yet, recommend — and scaffold only after approval. The bar is
**production-ready from the first commit**: strict configs are near-free on day one and
near-impossible to retrofit, so present strict as the default and loosening as the deviation
that needs a reason.

1. **Quality-gates setup (strict by default)**:
   - TypeScript `strict: true`, plus `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`,
     `noUnusedLocals`/`noUnusedParameters`; a real typecheck script (`tsc --noEmit`).
   - Type-aware ESLint with `@typescript-eslint/no-explicit-any: "error"` (matching the agents'
     zero-`any` rule mechanically), no-floating-promises, and a **zero-tolerance policy**: lint
     runs with `--max-warnings 0` — there is no "warnings are fine" tier, a gate either passes
     clean or fails.
   - A formatter (Prettier or equivalent) with a `format:check` script so style never reaches
     review.
   - Test-runner wiring **with one real passing test committed** — an empty test setup lets
     every later "tests pass" claim be vacuously true; the agents' evidence discipline needs a
     gate that can actually fail.
2. **CI workflow — on PR AND on merge**: trigger on `pull_request` and on `push` to the main
   branch (the merge run catches semantic conflicts between PRs that were each green alone).
   Every gate is a separate step — typecheck, lint, format check, tests, build — so one run
   reports every failure. Shape the jobs so they can be marked required status checks, and
   recommend enabling branch protection (required checks + no force-push) once the repo is on
   GitHub — that's a repo setting the user must click, not a file; put it in the hand-over
   summary as a reminder.
3. **Env hygiene**: `.env.example` documenting every env location, `.env` git-ignored, and the
   no-secrets-in-client-shipped-vars rule wired into AGENTS.md gotchas.
4. **Further production hardening (optional menu items, recommend but don't push)**:
   - Node version pinning: `.nvmrc` + `engines` in package.json, and the same version in CI.
   - Automated dependency updates: Dependabot config (or Renovate) with grouped minor updates.
   - Coverage floor on risk surfaces only: a coverage threshold scoped to the risk-surface
     modules from Phase 3 (e.g. the money module), not a blanket repo-wide percentage —
     blanket floors breed junk tests; targeted floors protect what's expensive to break.
   - A pre-push git hook running the gates locally (husky or a plain `.git/hooks` script) —
     optional because CI is the real gate; the hook just shortens the feedback loop.

Whatever is scaffolded here must match the gate commands quoted in the generated agent files
verbatim — the agents' quality gates and the CI steps are the same commands, so nothing passes
locally that fails in CI. Present these as a short menu with what each creates; the user picks.
Skip the phase entirely on repos that already have code.

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
| **Web-app testing** (Anthropic official, [repo](https://github.com/anthropics/skills)) | Playwright-driven browser testing — feeds qa-tester's "verify by running" and ui-ux-developer's responsive checks | `npx skillfish add anthropics/skills webapp-testing --project` | `npx skillfish add anthropics/skills webapp-testing --global` — or natively: `/plugin marketplace add anthropics/skills` in Claude Code |
| **Superpowers** ([repo](https://github.com/obra/superpowers)) | Full development methodology: TDD, systematic debugging, planning, brainstorming skills | — (plugin manager installs are per user) | Claude Code: `/plugin install superpowers@claude-plugins-official`. OpenCode is also supported — see the repo's per-agent install instructions |

**Superpowers caveat (present it honestly):** it is a complete process methodology and overlaps
with this team's Fable protocol. Offer it as optional and say the agent protocol wins where the
two conflict; a note to that effect goes in AGENTS.md gotchas if installed.

**Security review** (offer alongside the add-ons, but it is generated, not installed):
- Claude Code ships `/security-review` built in — no install; recommend it as a pre-merge step
  and reference it in the qa-tester checklist and protocol.
- OpenCode has no built-in equivalent. If the user wants parity, generate
  `.opencode/command/security-review.md`: an OpenCode command whose body is a security-review
  prompt tuned to THIS project — the interview's risk surfaces, per-role access model, secret
  locations, and money/PII rules — instructing a review of the current diff for injection,
  authn/authz gaps, secret exposure, unsafe rendering, and risk-surface-specific issues, with
  findings reported file:line by severity and NO code edits. Frontmatter: `description` plus
  `agent: qa-tester` so it runs with qa-tester's read-only-plus-tests permissions.

Notes: `npm install -g` is machine-wide either way (it's the CLI, not the skill) — say so when
asking. The two design add-ons are most useful on projects with a UI; if the project has no
frontend, still offer them but say they likely won't trigger. After the menu, ask one free-text
follow-up: "any other skills/plugins you already use that I should install?" — install at the
user's chosen level using the same tools (skillfish / plugin marketplace), never guessing at a
source. Record what was installed (and at which level) in the hand-over summary. This table is
meant to grow — add rows as new add-ons prove useful.
