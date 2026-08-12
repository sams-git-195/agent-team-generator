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

## Testing plan for the skill itself

Application-scenario test (reference/technique skill): dispatch a subagent with only the skill
files and a fictional project brief + canned interview answers; review the generated file set
against the verification checklist. Fix gaps found, re-test if changes are substantive.
