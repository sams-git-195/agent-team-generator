---
name: agent-team-generator
description: Use when setting up the AI agent team for a new project — scaffolding AGENTS.md, CLAUDE.md, .claude/agents, .opencode/agents files, an agent protocol, or project documentation structure. Triggers on "set up my agent team", "scaffold agents", "create AGENTS.md", or "new project agent setup".
---

# Agent Team Generator

Scaffolds a complete disciplined agent-team setup for a project: a main agent that leads
(there is no project-manager file), specialist subagents for both Claude Code and OpenCode 2,
an independent code-reviewer, a Fable-level process protocol so mid-level models follow
frontier-model steps, and a plain-English `documentation/` system maintained as part of
Definition of Done.

**Core principle:** the quality bar lives in the *process files*, not the model. Stated lanes,
mandatory evidence, the senior ladder, and self-checks are what make a mid-level model behave
like Fable. Generic agents don't hold the bar — every generated rule must name real paths,
commands, and business rules from this project.

**Second principle: permission is not instruction.** Permissions are open by default so that
a user's instruction is carried through without prompts; what agents actually do is set by
the protocol — commit freely, but push, deploy, or destroy only when the user has said so.

## References (read before the matching step)

| File | Read when |
|---|---|
| `references/interview.md` | Step 1 — question bank, phased |
| `references/permission-policy.md` | Step 1 (Phase 5.3) and Step 4 — the tiers, `opencode.json`, `.claude/settings.json` |
| `references/fable-playbook.md` | Step 3 — the process bar to embed everywhere |
| `references/engineering-standard.md` | Step 3 (protocol §2) and Step 4 — the senior ladder, the code bar, and the stack hygiene table that fills `{LANGUAGE_HYGIENE_RULE}`, `{GREENFIELD_GATES}`, `{ENV_CONVENTION}`, `{UNSAFE_RENDER_APIS}`, `{DEBUG_PRINT}` |
| `references/design-standard.md` | Step 4 — the Design bar carried by every role that builds UI |
| `references/protocol-template.md` | Step 3 — `.agents/rules/claude-agent-protocol.md` |
| `references/agents-md-template.md` | Step 3 — `AGENTS.md` + `CLAUDE.md` |
| `references/templates/<role>.md` | Step 4 — **pre-filled files for the core roles (+ fullstack-developer); use these first** |
| `references/agent-skeleton.md` + `references/role-library.md` | Step 4 — custom roles, rule meanings, the OpenCode 1 → 2 mapping |
| `references/documentation-convention.md` | Step 5 — `documentation/` incl. `known-issues.md` |
| `scripts/verify-team.js` | Step 6 — copy to the target's `.agents/` and run; mechanical checks |
| `fixtures/sample-brief.md` | Testing the skill itself only — never read during a real run |

**Baked defaults (never interview questions):** the main agent leads and may do small changes
itself under the matching agent's rules; open edit access with a stated lane per agent; the
user-gated list (protocol §6 — commit freely; push/PR/deploy/shared-DB migration/destructive
commands only on the user's instruction, then without re-asking); the senior ladder and its
floor; the senior + security bar for product-specialist and architect; the Fable QA process
for qa-tester; the Design bar for UI roles; code-reviewer in every roster. The permission
tier (Autonomous / Open / Guarded / Standard / Strict / Custom) is chosen in interview Phase
5.3 — Autonomous is the recommendation.

## Workflow

**Step 0 — Survey.** If the target repo already has any of `AGENTS.md`, `CLAUDE.md`,
`.claude/agents/`, `.opencode/agents/` (or the v1 `.opencode/agent/`), `opencode.json`,
`.agents/`, or `documentation/`, read them and tell the user exactly what exists and what
would be overwritten or replaced. Never overwrite without explicit approval. Read the
codebase (package.json, config files, folder layout, any design tokens) so the interview only
asks what the repo can't answer.

**Step 1 — Interview.** Run `references/interview.md` phase by phase, one topic per message
(AskUserQuestion for enumerable choices, free text otherwise). Do not skip Phase 0 (which
harness: Claude Code / OpenCode / both kept in line / another), Phase 3 (risk surfaces),
Phase 5 (never-do list, permission tier, report style), or Phase 7.0 (separate backend + UI
devs vs a single fullstack-developer) — they parameterise everything. After Phase 4, offer
the **fast path** (interview.md: accept the recommended defaults for the remaining phases in
one question). Record answers; anything the user defers becomes an explicit `⚠️ undecided`
marker in the output, never a guess. On a greenfield repo, settle interview Phase 8's gate
list here, before Step 3, so the gate commands written into the protocol and agent files are
final; the scaffolding itself still happens in Step 7.

**Step 2 — Roster proposal (approval gate).** Propose the adapted roster per interview Phase 7:
role list with one-line justification for each deviation from the core six
(product-specialist, architect, backend-developer, ui-ux-developer, qa-tester,
code-reviewer), the lane map (globs per role, shared files that must be sequenced), the model
matrix (CC baselines + escalation triggers from risk surfaces; OC `provider/model#variant`
per agent), and — on greenfield — any **prescribed conventions** the interview didn't supply
(the client-singleton path, the money module, schema/migration and test locations, the
design-token file), labelled as proposals, not facts. Root manifests, lockfiles, CI
workflows and tooling config are the main agent's shared root files unless the roster has a
devops-engineer — list them in the lane map so no file is unowned. **Get
explicit approval before writing any file.**

**Step 3 — Foundation files.** Generate in this order, filling every placeholder from the
interview:
1. `.agents/rules/claude-agent-protocol.md` from `protocol-template.md`, with the Fable
   playbook, the senior ladder and the engineering standard embedded in §2 and tuned to this
   project's risk surfaces and stack (hygiene table row). The main agent's contract is §1;
   the user-gated list is §6.
2. `AGENTS.md` from `agents-md-template.md` — including the "How we work" section, which is
   what a harness with no auto-loaded protocol relies on; then `CLAUDE.md` (`@AGENTS.md` +
   `@.agents/rules/claude-agent-protocol.md`) when Claude Code is a target. `{AGENT_DIR}` in
   the protocol is the harness's agent directory: `.claude/agents`, `.opencode/agents`, or
   `.agents/agents`. With Both, write it as "your harness's agent directory (`.claude/agents`
   or `.opencode/agents`)" so neither harness is sent to the other's files.

**Step 4 — Agent files (per the Phase 0 harness choice).** For each core role, start from
its pre-filled file in `references/templates/` and fill the placeholders — do not re-derive
sections the template already has. Custom roles (not in templates/) are composed from
skeleton + role library; any role that builds UI carries the Design bar. Same persona
everywhere; only frontmatter differs. **No project-manager file in any harness.** What gets
written:

| Harness choice | Generates (in addition to Steps 3 and 5) |
|---|---|
| **Both** (default) | everything in the two rows below, plus the "keep both sets in step" rule in AGENTS.md |
| **Claude Code** | `CLAUDE.md` (two `@` lines) · `.claude/agents/<role>.md` for every role (no `tools:` line — agents inherit all tools) · `.claude/settings.json` with the chosen tier (`permission-policy.md` §Claude Code) |
| **OpenCode 2** | `.opencode/agents/<role>.md` for every role (`mode: subagent`, `model: provider/model#variant`, no `name:`, no `permissions:`) · `opencode.json` at the repo root with the chosen tier as a `permissions` rule list · no `CLAUDE.md`; OpenCode's `build` agent is the main agent and reaches the protocol through `AGENTS.md` (OpenCode 2 accepts but does not load the `instructions` config key — never rely on it) |
| **Other harness** | `.agents/agents/<role>.md` for every role — the template bodies with no frontmatter · a pointer file if the harness is in `agent-skeleton.md` §Other harnesses · `⚠️ verify` on protocol §3's dispatch mechanics · the tier as prose in AGENTS.md (no mechanical enforcement outside CC/OC) |

**Step 5 — Documentation.** Seed `documentation/README.md`, `documentation/known-issues.md`
(+ `pages/`, `features/` dirs, one page doc per route the interview named) from
`documentation-convention.md`.

**Step 6 — Verify (mandatory, before reporting done).** First the mechanical pass: copy
`scripts/verify-team.js` from this skill to the target's `.agents/verify-team.js` (the project
keeps it — re-run whenever the roster or a convention changes) and run
`node .agents/verify-team.js` from the target root. Paste its output. Fix every `FAIL` and
re-run until clean; warnings go into the hand-over. On a greenfield repo the gate-script
check can only pass after Step 7 creates the manifest — **re-run the verifier after Step 7**
and paste that output too; remove the `⚠️ verify scripts exist after first scaffold` marker from
AGENTS.md once the manifest exists. It checks placeholders, roster == files, no
project-manager file, per-file shape, OpenCode 2 frontmatter (no v1 keys, no legacy
directory), `opencode.json` rule shape and ordering, CC/OC deny parity, gate scripts, and
docs seeding. Then the checks below that need judgment:
- Placeholder scan result read, not assumed: legitimate braces are `{var}` i18n syntax,
  any lowercase `{token}` (the verifier only flags ALL-CAPS), and `{ROLE}` in the protocol's
  generic handoff rule — anything else is unfilled.
- AGENTS.md roster table == files on disk in every generated agent directory; with Both,
  CC roster == OC roster. Only the directories the Phase 0 choice calls for exist.
- Every agent file has all of **its template's** sections (custom roles: all skeleton sections)
  and ends with a literal handoff line that names `main agent`, never `project-manager`.
- Lanes: each builder's "Your lane" globs are distinct from the other builders'; files that
  two builders both work in are named as shared and sequenced by the main agent.
- The user-gated list in protocol §6 names every command in the deploy set — the **union**
  of the stack's deploy channels (interview Phase 2.6) and the Phase 5 never-do list — and
  AGENTS.md §How we work names the same commands. This is the only guard in the Autonomous
  tier, so read it, don't assume it.
- Tiers other than Autonomous: `opencode.json` and `.claude/settings.json` carry the same
  ask and deny patterns, deploy set included, asks before denies in `opencode.json`.
- Model matrix names only roles that exist; every OC `model:` is `provider/model` with an
  optional `#variant`.
- `{REPORT_STYLE}` resolved to the same value in protocol §7 and AGENTS.md.
- UI roles carry the full Design bar, with `{DESIGN_TOKEN_SOURCE}` and `{BREAKPOINTS}`
  filled; AGENTS.md §UI has a design direction or the `⚠️ undecided` marker.
- Quality-gate commands quoted in protocol/agents exist in package.json (or equivalent). In a
  greenfield repo with no manifest yet, instead mark the gates in AGENTS.md with
  `⚠️ verify scripts exist after first scaffold` and say so in the handover.
- Docs folder seeded (add `.gitkeep` to empty dirs so git tracks them); `known-issues.md`
  present; protocol §4 and the qa-tester checklist both reference `documentation/`.

**Step 7 — Initialisation & add-ons.** On greenfield repos, run interview Phase 8: offer
production-ready standards as a menu — strict quality gates (strict TS, type-aware lint with
no-explicit-any as an error, `--max-warnings 0`, format check, a test runner with one real
test), CI on **both PR and merge** with every gate a separate step, env hygiene, and the
optional hardening items (version pinning, dependency updates, targeted coverage floors,
pre-push hook). Strict is the default; loosening needs a stated reason. Scaffold only what
the user approves (skip on repos that already have code). Then, on ALL repos, run interview
Phase 9: offer the optional skill add-ons — on any project with a UI, lead with the design
skills (`frontend-design` recommended; Impeccable; UI/UX Pro Max) — asking per add-on whether
to install at project or user level; run installs only after the user chooses, verify the
installed path, and never block on a failed add-on. For each design skill installed, add the
"load the skill before UI work" line to the UI role's Design bar. Also offer the
security-review option: built-in `/security-review` on Claude Code (reference it in protocol
+ qa-tester), and for OpenCode parity a generated `.opencode/commands/security-review.md`
tuned to the project's risk surfaces (see interview Phase 9 for its required shape).

**Step 8 — Hand over.** Summarise what was generated, list the `⚠️ undecided` and `⚠️ verify`
markers to resolve, name the permission tier and where it is written, and say plainly what
it does and does not block (Autonomous: nothing is blocked mechanically — the user-gated
list in protocol §6 is the guard; other tiers: a `deny` means the user runs that command
themselves). Tell the user how to work with the team: give an instruction and the main agent
carries it through; say "push" / "deploy" when they want that done; ask for "a code review"
to run the code-reviewer. Remind them: gotchas in AGENTS.md grow over the project's life;
keep every generated agent set in step. If the repo is git-initialised, make a single scoped
commit (committing is free; pushing waits for the user's word).

## Common mistakes

| Mistake | Fix |
|---|---|
| Generating generic agents ("write clean code") | Every rule names real paths/commands/rules from the interview |
| Copying another project's facts (its DB platform, money-module path, i18n layout) into a project without them | Role blocks are parameterised — include only what THIS stack has |
| Leaving TypeScript hygiene (`any`, `console.log`, `.env.example`) in a Python/Go/Rust project | Fill `{LANGUAGE_HYGIENE_RULE}` and friends from the stack hygiene table in `engineering-standard.md` |
| Creating a project-manager agent file | There is none, in any harness — the main agent leads (protocol §1, AGENTS.md §How we work) |
| Writing OpenCode 1 shapes (`.opencode/agent/`, `permission:` map, `bash:`, `name:`, top-level `temperature`) | OpenCode 2: `.opencode/agents/`, rule list in `opencode.json`, `shell`, filename is the ID, `model#variant` |
| Putting permission rules in agent files, or `tools:` in Claude Code agents | One policy, in `opencode.json` and `.claude/settings.json`; agents inherit |
| Treating open permissions as licence | The user-gated list (protocol §6) is in every agent's "Scope & focus"; verify it names this stack's deploy commands |
| Reading the senior ladder as "write less" and dropping error handling or UI states | The floor is part of the ladder — embed both, always together |
| A UI role without the Design bar, or a palette invented by the generator | Embed the bar; `⚠️ undecided` + "propose a direction first" when the user hasn't chosen |
| Skipping the roster approval gate | Lane disputes surface after generation — get approval first |
| Filling unknown business rules with plausible numbers | `⚠️ undecided — ask before implementing` markers, never guesses |
| Writing docs templates as code dumps | documentation/ is plain English for zero-context readers |
