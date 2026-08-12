---
name: agent-team-generator
description: Use when setting up the AI agent team for a new project — scaffolding AGENTS.md, CLAUDE.md, .claude/agents, .opencode/agent files, an agent protocol, or project documentation structure. Triggers on "set up my agent team", "scaffold agents", "create AGENTS.md", or "new project agent setup".
---

# Agent Team Generator

Scaffolds a complete disciplined agent-team setup for a project: the project-manager as the
MAIN session (not a subagent), specialist subagents for both Claude Code and OpenCode, a
Fable-level process protocol so mid-level models follow frontier-model steps, and a
plain-English `documentation/` system maintained as part of Definition of Done.

**Core principle:** the quality bar lives in the *process files*, not the model. Contracts,
closed allow-lists, mandatory evidence, and self-checks are what make a mid-level model behave
like Fable. Generic agents don't hold the bar — every generated rule must name real paths,
commands, and business rules from this project.

## References (read before the matching step)

| File | Read when |
|---|---|
| `references/interview.md` | Step 1 — question bank, phased |
| `references/fable-playbook.md` | Step 3 — the process bar to embed everywhere |
| `references/protocol-template.md` | Step 3 — `.agents/rules/claude-agent-protocol.md` |
| `references/agents-md-template.md` | Step 3 — `AGENTS.md` + `CLAUDE.md` |
| `references/templates/<role>.md` | Step 4 — **pre-filled files for the core roles (+ fullstack-developer); use these first** |
| `references/agent-skeleton.md` + `references/role-library.md` | Step 4 — custom roles only + rule meanings |
| `references/documentation-convention.md` | Step 5 — `documentation/` |

**Baked defaults (never interview questions):** git/deploy policy (commit freely; push/PR only
on the user's word or after asking; deploy/db-push never unprompted — protocol §6 verbatim);
the senior + security bar for product-specialist and architect; the Fable QA process for
qa-tester; the SHAPE of the OpenCode bash policy (allow-by-default with ask/deny exception
lists) — the exception lists themselves are tuned with the user in interview Phase 5.3, one
policy applied identically to every agent.

## Workflow

**Step 0 — Survey.** If the target repo already has any of `AGENTS.md`, `CLAUDE.md`,
`.claude/agents/`, `.opencode/agent/`, `.agents/`, or `documentation/`, read them and tell the
user exactly what exists and what would be overwritten. Never overwrite without explicit
approval. Read the codebase (package.json, config files, folder layout) so the interview only
asks what the repo can't answer.

**Step 1 — Interview.** Run `references/interview.md` phase by phase, one topic per message
(AskUserQuestion for enumerable choices, free text otherwise). Do not skip Phase 3 (risk
surfaces), Phase 5 (git policy), or Phase 7.0 (separate backend + UI devs vs a single
fullstack-developer) — they parameterise everything. Record answers; anything the
user defers becomes an explicit `⚠️ undecided` marker in the output, never a guess.

**Step 2 — Roster proposal (approval gate).** Propose the adapted roster per interview Phase 7:
role list with one-line justification for each deviation from the core six, the file-ownership
map (globs per role, shared files that must be sequenced), the model matrix (CC baselines +
escalation triggers from risk surfaces; OC pins per agent — the project-manager is never
pinned), and — on greenfield — any **prescribed conventions** the interview didn't supply
(e.g. a client-singleton path, emulator usage), labelled as proposals, not facts. **Get
explicit approval before writing any file.**

**Step 3 — Foundation files.** Generate in this order, filling every placeholder from the
interview:
1. `.agents/rules/claude-agent-protocol.md` from `protocol-template.md`, with the Fable playbook
   embedded and tuned to this project's risk surfaces. PM-as-main-session is §1.
2. `AGENTS.md` from `agents-md-template.md`; then `CLAUDE.md` (`@AGENTS.md` +
   `@.agents/rules/claude-agent-protocol.md`).

**Step 4 — Agent files.** For each core role, start from its pre-filled file in
`references/templates/` and fill the placeholders — do not re-derive sections the template
already has. Custom roles (not in templates/) are composed from skeleton + role library.
Output: `.claude/agents/<role>.md` for every role EXCEPT project-manager, and
`.opencode/agent/<role>.md` for every role INCLUDING project-manager (`mode: primary`, no
model pin, docs-only edit rights; its body carries the PM sections since OpenCode has no
auto-loaded protocol). Same persona in both tools; only frontmatter/enforcement mechanics
differ. Every OC file carries the standard bash policy with this project's deploy commands in
the `deny` list.

**Step 5 — Documentation.** Seed `documentation/README.md` (+ `pages/`, `features/` dirs, one
example page doc if concrete pages are known) from `documentation-convention.md`.

**Step 6 — Verify (mandatory, before reporting done).**
- Grep for unfilled placeholders: zero ALL-CAPS `{LIKE_THIS}` tokens outside fenced output
  templates. Legitimate braces remain: `{var}` i18n syntax, lowercase tokens inside Output
  Format templates the roles copy, and `{ROLE}` in the protocol's generic handoff rule.
- AGENTS.md roster table == files on disk; CC roster == OC roster minus PM.
- Every agent file has all of **its template's** sections (custom roles: all skeleton sections)
  and ends with a literal handoff line.
- Ownership globs mutually exclusive **between builder roles**; the two sanctioned exceptions
  are qa-tester's test globs (overlap builders' co-located tests by design) and files
  explicitly declared shared + PM-sequenced. Anything else overlapping is a failure.
- Model matrix names only roles that exist; OC edit allow-lists match the prose scope.
- Every OC bash block is allow-by-default with the ask/deny lists agreed in interview
  Phase 5.3 (identical across all agents — including `git push*`/`gh pr create*` at least at
  ask) AND a `deny` line for every command in the deploy-deny set — the **union** of the
  stack's deploy channels (interview Phase 2.6) and the Phase 5 never-do list; if the two
  disagree, the union wins. `{POLICY_ADJUSTMENT_LINES}` resolved in every file (extra lines
  inserted, or the placeholder deleted).
  The OC project-manager has `mode: primary`, no `model:` line, and docs-only edit rights.
- Quality-gate commands quoted in protocol/agents exist in package.json (or equivalent). In a
  greenfield repo with no manifest yet, instead mark the gates in AGENTS.md with
  `⚠️ verify scripts exist after first scaffold` and say so in the handover.
- Docs folder seeded (add `.gitkeep` to empty dirs so git tracks them); protocol §4 and the
  qa-tester checklist both reference it.

**Step 7 — Initialisation & add-ons.** On greenfield repos, run interview Phase 8: offer
quality-gates setup, CI workflow, and env hygiene as a menu; scaffold only what the user
approves (skip on repos that already have code). Then, on ALL repos, run interview Phase 9:
offer the optional third-party skill add-ons (UI/UX Pro Max, Animation Principles, …), asking
per add-on whether to install at project or user level; run installs only after the user
chooses, verify the installed path, and never block on a failed add-on.

**Step 8 — Hand over.** Summarise what was generated, list the `⚠️ undecided` markers to
resolve, and remind the user: gotchas in AGENTS.md grow over the project's life — append when
a convention changes; keep `.claude/agents/` and `.opencode/agent/` in step.
If the repo is git-initialised, make a single scoped commit (per the fixed git policy —
committing is fine, pushing waits for the user).

## Common mistakes

| Mistake | Fix |
|---|---|
| Generating generic agents ("write clean code") | Every rule names real paths/commands/rules from the interview |
| Copying another project's facts (its DB platform, money-module path, i18n layout) into a project without them | Role blocks are parameterised — include only what THIS stack has |
| Creating a `.claude/agents/project-manager.md` | PM is the main session (protocol §1); only OC gets a PM file (`mode: primary`) |
| Skipping the roster approval gate | Ownership disputes surface after generation — get approval first |
| Filling unknown business rules with plausible numbers | `⚠️ undecided — ask before implementing` markers, never guesses |
| Writing docs templates as code dumps | documentation/ is plain English for zero-context readers |
