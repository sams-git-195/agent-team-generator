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

## Testing plan for the skill itself

Two layers:

1. **Smoke test** (`npm test`): installer round-trip, template/reference cross-references, and
   `verify-team.js` against a synthetic generated tree (one good, seven broken variants).
2. **Application-scenario test** (reference/technique skill): dispatch a subagent with only the
   skill files, an empty git-initialised temp directory, and `fixtures/sample-brief.md` as the
   canned interview. Run `scripts/verify-team.js` on the output, then review it against the
   fixture's Expectations list. Fix gaps found, re-test if changes are substantive.
