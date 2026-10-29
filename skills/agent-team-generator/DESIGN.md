# Design: agent-team-generator skill

Date: 2026-08-02 · Approved by Sam in conversation

## Goal

A personal Claude Code skill that scaffolds the full agent-team setup for a **new project** — a
project-manager-led team with hard scope contracts — so that mid-level models (Sonnet, DeepSeek,
Qwen…) follow the same process a Fable-class model would follow.

## Decisions (user-confirmed)

1. **PM is the main agent.** The main Claude Code session permanently operates as the
   project-manager persona (plans, decomposes, dispatches all subagents, maintains docs). No
   separate `project-manager.md` under `.claude/agents/`. In OpenCode, project-manager is
   `mode: primary`; all other agents are `mode: subagent`.
2. **Adaptive roster.** Start from the six-persona template (product-specialist, architect,
   project-manager, backend-developer, ui-ux-developer, qa-tester) but rename/merge/add roles
   based on the interview (stack-driven). Ownership maps generated from the real stack.
3. **Docs convention: per-page + features index.** `documentation/pages/<page>.md`,
   `documentation/features/<feature>.md`, `documentation/README.md` index. Updating affected docs
   is part of Definition of Done, enforced in the PM contract and the qa-tester checklist.
4. **OpenCode model pins are asked during the interview** and written per-agent.
5. **Maximal templates.** The skill ships full ready-to-fill templates for every generated file,
   plus a standalone "Fable playbook" of pre-instructions (what Fable would do) that gets embedded
   into the generated protocol and echoed in each agent's non-negotiables.

## Generated output (in the target project)

| File | Purpose |
|---|---|
| `AGENTS.md` | Single source of truth: product context, roster, commands, gotchas, architecture, business rules |
| `CLAUDE.md` | `@AGENTS.md` + `@.agents/rules/claude-agent-protocol.md` |
| `.agents/rules/claude-agent-protocol.md` | Fable-level protocol; PM-as-main-session contract; model matrix; docs contract; git policy |
| `.claude/agents/<role>.md` | One per roster role except PM |
| `.opencode/agent/<role>.md` | Full roster incl. PM (`mode: primary`) |
| `documentation/README.md`, `pages/`, `features/` | Plain-English living docs |

## Skill file layout

```
agent-team-generator/
  SKILL.md                          workflow: interview → roster proposal → generate → verify
  DESIGN.md                         this spec
  references/
    interview.md                    phased question bank
    fable-playbook.md               the "what Fable would do" pre-instructions
    protocol-template.md            claude-agent-protocol.md template with {PLACEHOLDERS}
    agents-md-template.md           AGENTS.md template
    agent-skeleton.md               shared section skeleton + CC/OC frontmatter + writing rules
    role-library.md                 per-role content blocks (core six + optional roles)
    documentation-convention.md     docs templates + PM docs contract
    permission-policy.md            the five permission tiers (OC blocks + CC settings.json)
    engineering-standard.md         twelve code rules + the stack hygiene table
    templates/<role>.md             pre-filled per-role files (v2)
  scripts/verify-team.js            mechanical checks, copied into the target's .agents/
  fixtures/sample-brief.md          canned interview for the application-scenario test
```

## Verification (built into the skill)

After generating: no unfilled placeholders; AGENTS.md roster == files on disk; CC and OC rosters
match (± PM); every agent ends with a handoff line; ownership paths are consistent and
non-overlapping; the model matrix names only existing agents; docs folder seeded.

## v2 (2026-08-08, user-confirmed)

1. **Full pre-filled per-role templates** in `references/templates/` (project-manager [OC-only,
   primary], product-specialist, architect, backend-developer, ui-ux-developer, qa-tester) —
   generation = fill placeholders; skeleton + role library serve custom roles only.
2. **Baked defaults, no longer interviewed**: git/deploy policy (commit freely; push/PR only on
   the user's word or after asking; deploy/db-push never unprompted), senior + security + edge-
   case mandates for product-specialist and architect, the Fable QA process for qa-tester, and
   the OC permission style.
3. **OpenCode bash policy**: `"*": allow` with `ask` (git push, rm, npm install, curl) and
   `deny` (force push, reset --hard, clean -fd, sudo, chmod, pipe-to-shell, every deploy/DB-push
   command from the interview).
4. **OC model pins asked per agent**; project-manager never pinned (primary uses OpenCode's
   model selector). No default stack; UI conventions and i18n asked per project.
5. **Greenfield init recommendations** (interview Phase 8 / SKILL Step 7): quality-gates setup,
   CI workflow, env hygiene — menu, approval-gated.
6. Layout confirmed: `.agents/` = protocol + shared rules; personas live only in
   `.claude/agents/` and `.opencode/agent/`.

## v3 (2026-09-08, user-confirmed)

1. **Harness choice (interview Phase 0)**: Claude Code only / OpenCode only / both kept in
   line (default; `CLAUDE.md` → `AGENTS.md` + protocol, both agent sets) / another harness
   (neutral persona files in `.agents/agents/` + a pointer file where known).
2. **Permission tiers** replace the single tuned policy: Sandbox (allow all) · Open (deny
   destructive only) · Guarded (ask outside the repo) · Standard (recommended) · Strict ·
   Custom. One source (`references/permission-policy.md`), one `{PERMISSION_POLICY_BLOCK}`
   placeholder in every OC template, and the same tier written to `.claude/settings.json` so
   Claude Code enforces it too. Destructive set + deploy set stay `deny` in every tier but
   Sandbox. Coverage widened (flag-after force pushes, restore/checkout discards, branch -D,
   stash drop/clear, chown/dd/mkfs, wget, non-npm package managers); wholesale `npx` ask
   dropped.
3. **Engineering standard** (`references/engineering-standard.md`): twelve language-agnostic
   code rules embedded in protocol §2, plus a stack hygiene table (TypeScript / Python / Go /
   Rust / other) that fills the hygiene, gates, env, unsafe-API and debug-print placeholders.
   Templates carry no TypeScript-specific rules any more; Phase 8 greenfield gates come from
   the same table.
4. **Project-manager answer style** (interview 5.4): Technical / Direct with technical
   summary (default) / Plain English. The report shape is fixed in protocol §7 (Outcome →
   What changed → Evidence → Open questions → Next; nothing before the outcome); the preset
   sets depth only. Mirrored in the OC PM file and one AGENTS.md line.
5. **Interview fast path**: after Phases 0–4, one question accepts the recommended defaults
   for the rest (never-do list and OC model pins are always asked).
6. **Mechanical verification**: `scripts/verify-team.js` is copied into the target's
   `.agents/` and run in Step 6 — placeholders, roster == files, OC policy identity and
   ordering, ownership overlaps, CC/OC deny parity, gate scripts, docs seeding. The smoke
   test exercises it against a synthetic tree with seven deliberate breakages.
7. `color:` in OC frontmatter and the `"* | sh"` deny lines are flagged "verify
   against the installed OpenCode version" rather than asserted.

## v4 (2026-10-03, requested by Sam)

Supersedes Decision 1, v2.2–v2.4 and v3.2 where they conflict.

1. **Open permissions, user-gated by instruction.** New recommended tier **Autonomous**
   (allow all — replaces Sandbox as a named tier and Standard as the default). The guard is
   behavioural: protocol §6 "Autonomy & User-Gated Actions" — commit freely; push, PRs,
   deploys, shared-database migrations and destructive commands only on the user's
   instruction, and then without re-asking. Stricter tiers remain as an optional mechanical
   net. **Edit access is open for every agent in every tier**; ownership is a stated lane
   ("Scope & focus"), not an `edit` deny map. Claude Code agents drop `tools:` and inherit
   everything.
2. **No project-manager agent.** The main session leads in every harness (OpenCode: the
   built-in `build` agent). It prefers dispatching and may do small, quick, single-discipline
   changes itself under the matching agent's file. The contract is protocol §1, with the
   short form in `AGENTS.md` §How we work because OpenCode 2 does not load `instructions`.
3. **Senior ladder + floor** in the engineering standard, the protocol, the playbook and every
   builder: need → reuse → installed dependency → one line → minimum, never below error
   handling, graceful user-facing errors, full UX, and the full ask. Tests must be able to
   fail (change a value, see red).
4. **Design bar** (`references/design-standard.md`) embedded in every UI role: direction
   before pixels, tokens, designed states, whole pages, a slop list, and looking at
   screenshots. Design skills (`frontend-design`, Impeccable, UI/UX Pro Max) recommended in
   Phase 9.
5. **OpenCode 2**: `.opencode/agents/`, filename as ID, `model: provider/model#variant`,
   permissions as a `{action, resource, effect}` rule list written once in `opencode.json`
   (`shell`/`subagent` replace `bash`/`task`), no top-level `temperature`, commands in
   `.opencode/commands/`. v1 is documented as a mapping table only.
6. **code-reviewer** core role: user-invoked, independent, reviews the diff and around it,
   grades 🔴 Blocker / 🟠 Should fix / 🟡 Nit / 🔵 FYI / 🟣 Minor, runs a mutation check,
   logs Minors to `documentation/known-issues.md`, and returns fix prompts.
8. **One scale.** Self-QA, qa-tester and code-reviewer all grade on the five lights, defined
   once in protocol §5; QA fails on any 🔴 or 🟠, and qa-tester may log 🟣 to known-issues too.
9. **Tests are a gate on every change** — no "only when a risk surface is touched" tier.
10. **Local secrets are readable and editable** by agents; the rule is that their values never
    reach a commit, a log, a report or client-shipped code.
11. **Shared root files** (root manifests, lockfiles, CI, tooling config) belong to the main
    agent. Page-doc filenames follow a route → filename rule. The optional security review
    has fixed slots in protocol §5 and the qa-tester checklist. `{RISK_SURFACES}` is always a
    bracketed list after the words "risk surface".
7. Verifier and smoke test reworked for all of the above; the builder-glob overlap check is
   gone with the `edit` maps and is now a judgment check in SKILL.md Step 6.

## v0.4 (2026-10-11, requested by Sam)

1. **The 🟣 gate.** `known-issues.md` was filling with issues nobody could hit. Before a 🟣
   Minor is logged, qa-tester and code-reviewer answer three questions, defined once in
   protocol §5 and repeated in both templates: who does it reach (end user, admin, operator —
   developer-only is a 🟡 Nit), is it seen or unseen (silent data/security/money effects are
   re-graded up, not logged), and can it actually happen (unreachable → dropped; reachable →
   likelihood and effect). The entry format records the answers (Who · Seen · Happens ·
   Effect), and dropped candidates are listed under "Triaged out" so the user can overrule.
2. **Every 🔴 and 🟠 names a failure scenario** (real action → what goes wrong → who it hits).
   No scenario — unreachable or only suspected — means "Unverified concerns", outside the
   verdict, so an impossible path can't block a merge. Standard-level 🟠s (thin tests,
   re-implementation) name the bug they would let through, so they stay in force.

## v0.5 (2026-10-13, requested by Sam)

1. **The Usability bar.** The Design bar said how a screen should look but almost nothing
   about how it should work, so a hard-to-use screen could pass review. It now sits beside a
   Usability bar from the standard references a senior product designer works to (Nielsen's
   heuristics; Hick's, Fitts's and Jakob's laws; WCAG 2.2 2.4.11 and 2.5.7): count the steps
   of the core flows (`{CORE_FLOWS}`, from interview Phase 3) and justify any added one, few
   choices at a time, easy targets, familiar patterns, visible status, recognition over
   recall, calm screens, one term per concept, trust before payment. A Do/Don't table makes
   the common calls concrete. A breach is 🟠 for qa-tester and code-reviewer; the UI role
   reports flow steps before → after.
2. **Ten more slop-list items** — the interaction tells of generated UI: modals for
   everything, full-page spinners, vague buttons, blaming errors, dead-end empty states,
   disabled-with-no-reason, placeholder-as-label, unlabelled icons, everything emphasised,
   dark patterns.

Ported from SpeakAppi, where it was written first (PR #69).

## v0.5.1 (2026-10-13)

The qa-tester template's Design bar and Usability bar checks are marked *(omit … if the
project has no UI)*, so an API-only or CLI project is not handed checks that cannot apply —
or an unfilled `{CORE_FLOWS}`, which the verifier would fail. The price-breakdown clause is
scoped to products that take payments, matching the Usability bar itself.

## v0.6 (2026-10-29, requested by Sam)

1. **One file, rendered.** The model writes `.agents/team.json` (`references/team-schema.md`;
   `fixtures/team.json` is the worked example) and `scripts/render-team.js` renders every
   generated file from `references/templates/` with a dependency-free mustache-style engine
   (`{{key}}`, `{{#section}}`, `{{^inverted}}`, `{{> partial}}`, renumbered lists). No
   hand-filled placeholders; a verifier FAIL is fixed in `team.json` and re-rendered; a re-run
   of the skill starts from the existing `team.json`. The render ends by running the verifier.
2. **One-message intake.** Phases 0–7 collapse into one paragraph from the user, a summary
   table with a source label per row that the user corrects, and one question call for the
   enumerable gates (harness, builder split, report style, security review, design skill).
   Risk surfaces and the never-do list are always confirmed explicitly. Greenfield and add-on
   menus live in `greenfield.md` and `add-ons.md`, read only when they apply.
3. **Permission tiers removed.** Allow-all is the only mode, written to `.claude/settings.json`
   and `opencode.json`; protocol §6 is the guard. `permission-policy.md`, the tier question,
   the CC/OC parity and ordering checks and their tests are gone.
4. **Token cuts.** Skill side: the Design and Usability bars are one partial (were three
   verbatim copies); the user-gated paragraph and grounding rules are partials; the twelve
   engineering rules and the ladder live only in `templates/protocol.md` §2
   (`engineering-standard.md` keeps the hygiene table); template preambles and OpenCode
   frontmatter boilerplate moved into the renderer. Generated side: the lights, the 🟣 gate
   and the known-issues entry format are defined once (protocol §5, `known-issues.md`) and
   referenced from qa-tester and code-reviewer; gate commands are quoted in full where they
   are run and as "the gates" elsewhere. `fable-playbook.md` is kept as background reading.
5. **Models.** Sonnet baseline for product-specialist and builders with a step-up rule in
   protocol §3 (risk surfaces, multi-module changes, design decisions, a failed first
   attempt; Claude Code: `model` on the dispatch); Opus for architect, qa-tester and
   code-reviewer, never stepped down. OpenCode agent files carry no model pin: OpenCode 2
   selects the model on the subagent call, so the per-agent pin question is gone
   (`roles.<name>.oc_model` remains as an optional override).
6. **Small tasks skip qa-tester.** Protocol §5: an S task off every risk surface relies on
   the builder's self-QA; M/L, risk surfaces and user-visible features go to qa-tester.
7. **General skill.** `bin/cli.js` gains `--harness claude|opencode|codex|cursor|gemini|agents`
   presets (paths verified against each harness's docs) and `--to <dir>`; the skill text names
   the harness's question and subagent mechanisms generically with Claude Code as the example;
   README and package metadata describe an agent skill, not a Claude-only one.
8. **Smoke test** renders the fixture end to end into a temp project, runs the verifier, and
   spot-checks the output; it also checks that `team-schema.md` documents every template tag.

## v0.6.1 (2026-10-29)

Removed the superseded `protocol-template.md`, `agents-md-template.md` and
`documentation-convention.md` from `references/` (their content lives in `templates/`); the
smoke test now fails if they come back.

## Testing plan for the skill itself

Two layers:

1. **Smoke test** (`npm test`): installer round-trip, template/reference cross-references, a
   full render of `fixtures/team.json` with the verifier, and `verify-team.js` against a
   synthetic generated tree (good variants and deliberately broken ones).
2. **Application-scenario test** (reference/technique skill): dispatch a subagent with only the
   skill files, an empty git-initialised temp directory, and `fixtures/sample-brief.md` as the
   canned interview. Run `scripts/verify-team.js` on the output, then review it against the
   fixture's Expectations list. Fix gaps found, re-test if changes are substantive.
