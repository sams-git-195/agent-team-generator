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
| `references/permission-policy.md` | Step 1 (Phase 5.3) and Step 4 — the bash-permission tiers, OC blocks, CC settings |
| `references/fable-playbook.md` | Step 3 — the process bar to embed everywhere |
| `references/engineering-standard.md` | Step 3 (protocol §2) and Step 4 — the code bar, plus the stack hygiene table that fills `{LANGUAGE_HYGIENE_RULE}`, `{GREENFIELD_GATES}`, `{ENV_CONVENTION}`, `{UNSAFE_RENDER_APIS}`, `{DEBUG_PRINT}` |
| `references/protocol-template.md` | Step 3 — `.agents/rules/claude-agent-protocol.md` |
| `references/agents-md-template.md` | Step 3 — `AGENTS.md` + `CLAUDE.md` |
| `references/templates/<role>.md` | Step 4 — **pre-filled files for the core roles (+ fullstack-developer); use these first** |
| `references/agent-skeleton.md` + `references/role-library.md` | Step 4 — custom roles only + rule meanings |
| `references/documentation-convention.md` | Step 5 — `documentation/` |
| `scripts/verify-team.js` | Step 6 — copy to the target's `.agents/` and run; mechanical checks |
| `fixtures/sample-brief.md` | Testing the skill itself only — never read during a real run |

**Baked defaults (never interview questions):** git/deploy policy (commit freely; push/PR only
on the user's word or after asking; deploy/db-push never unprompted — protocol §6 verbatim);
the senior + security bar for product-specialist and architect; the Fable QA process for
qa-tester; the destructive set and this stack's deploy set are `deny` in every permission
tier except Sandbox — the tier itself (Sandbox / Open / Guarded / Standard / Strict / Custom)
is chosen in interview Phase 5.3 and applied identically to every agent in every harness.

## Workflow

**Step 0 — Survey.** If the target repo already has any of `AGENTS.md`, `CLAUDE.md`,
`.claude/agents/`, `.opencode/agent/`, `.agents/`, or `documentation/`, read them and tell the
user exactly what exists and what would be overwritten. Never overwrite without explicit
approval. Read the codebase (package.json, config files, folder layout) so the interview only
asks what the repo can't answer.

**Step 1 — Interview.** Run `references/interview.md` phase by phase, one topic per message
(AskUserQuestion for enumerable choices, free text otherwise). Do not skip Phase 0 (which
harness: Claude Code / OpenCode / both kept in line / another), Phase 3 (risk surfaces),
Phase 5 (git policy, permission tier, and the project-manager's answer style), or Phase 7.0
(separate backend + UI devs vs a single fullstack-developer) — they parameterise everything. After Phase 4, offer the **fast path**
(interview.md: accept the recommended defaults for the remaining phases in one question).
Record answers; anything the user defers becomes an explicit `⚠️ undecided` marker in the
output, never a guess.

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
   and the engineering standard embedded in §2 and tuned to this project's risk surfaces and
   stack (hygiene table row). PM-as-main-session is §1.
2. `AGENTS.md` from `agents-md-template.md`; then `CLAUDE.md` (`@AGENTS.md` +
   `@.agents/rules/claude-agent-protocol.md`) when Claude Code is a target. `{AGENT_DIR}` in
   the protocol is the primary harness's agent directory (`.claude/agents` when Claude Code is
   a target, else `.opencode/agent`, else `.agents/agents`).

**Step 4 — Agent files (per the Phase 0 harness choice).** For each core role, start from
its pre-filled file in `references/templates/` and fill the placeholders — do not re-derive
sections the template already has. Custom roles (not in templates/) are composed from
skeleton + role library. Same persona everywhere; only frontmatter/enforcement mechanics
differ. What gets written:

| Harness choice | Generates (in addition to Steps 3 and 5) |
|---|---|
| **Both** (default) | everything in the two rows below, plus the "keep both sets in step" rule in AGENTS.md |
| **Claude Code** | `CLAUDE.md` (two `@` lines) · `.claude/agents/<role>.md` for every role EXCEPT project-manager (PM = main session) · `.claude/settings.json` with the chosen tier in CC syntax (`permission-policy.md` §Claude Code) |
| **OpenCode** | `.opencode/agent/<role>.md` for every role INCLUDING project-manager (`mode: primary`, no model pin, docs-only edit rights; its body carries the PM sections since OpenCode has no auto-loaded protocol) · every OC file carries the chosen tier in place of `{PERMISSION_POLICY_BLOCK}`, byte-identical across files, deploy set resolved into `deny` · no `CLAUDE.md`; AGENTS.md's protocol pointer is how OC sessions reach the protocol |
| **Other harness** | `.agents/agents/<role>.md` for every role INCLUDING project-manager — the template bodies with no frontmatter, scope contract kept as prose · a pointer file if the harness is in `agent-skeleton.md` §Other harnesses · `⚠️ verify` on protocol §3's dispatch mechanics · the tier as prose in AGENTS.md gotchas (no mechanical enforcement outside CC/OC) |

**Step 5 — Documentation.** Seed `documentation/README.md` (+ `pages/`, `features/` dirs, one
example page doc if concrete pages are known) from `documentation-convention.md`.

**Step 6 — Verify (mandatory, before reporting done).** First the mechanical pass: copy
`scripts/verify-team.js` from this skill to the target's `.agents/verify-team.js` (the project
keeps it — re-run whenever the roster or a convention changes) and run
`node .agents/verify-team.js` from the target root. Paste its output. Fix every `FAIL` and
re-run until clean; warnings go into the hand-over. On a greenfield repo the gate-script
check can only pass after Step 7 creates the manifest — **re-run the verifier after Step 7**
and paste that output too; remove the `⚠️ verify scripts exist after first scaffold` marker from
AGENTS.md once the manifest exists. It checks placeholders, roster == files,
per-file shape, OC mode/model/policy identity and ordering, builder ownership overlaps,
CC settings parity, gate scripts, and docs seeding. Then the checks below that need judgment:
- Placeholder scan result read, not assumed: legitimate braces are `{var}` i18n syntax,
  any lowercase `{token}` (the verifier only flags ALL-CAPS), and `{ROLE}` in the protocol's
  generic handoff rule — anything else is unfilled.
- AGENTS.md roster table == files on disk in every generated agent directory; with Both,
  CC roster == OC roster minus PM. Only the directories the Phase 0 choice calls for exist.
- Every agent file has all of **its template's** sections (custom roles: all skeleton sections)
  and ends with a literal handoff line.
- Ownership globs mutually exclusive **between builder roles**; the two sanctioned exceptions
  are qa-tester's test globs (overlap builders' co-located tests by design) and files
  explicitly declared shared + PM-sequenced. Anything else overlapping is a failure.
- Model matrix names only roles that exist; OC edit allow-lists match the prose scope.
- `{PM_STYLE}` resolved to the same value in protocol §7, the OC project-manager file, and
  AGENTS.md.
- Every OC bash block is the chosen tier's block from `permission-policy.md`, byte-identical
  across all agents, `"*"` default first and denies last (OpenCode: last match wins), AND a
  `deny` line for every command in the deploy set — the **union** of the stack's deploy
  channels (interview Phase 2.6) and the Phase 5 never-do list; if the two disagree, the union
  wins. Sandbox is the only tier without it, and the hand-over must then say "no mechanical
  deploy guard". `{POLICY_ADJUSTMENT_ASK_LINES}` / `{POLICY_ADJUSTMENT_DENY_LINES}` resolved
  in every file, each in its own band (extra lines inserted, or the placeholder deleted). `.claude/settings.json` exists, is valid JSON, and its `deny`
  array carries the same deploy set and destructive set in `Bash(… *)` form.
  The OC project-manager has `mode: primary`, no `model:` line, and docs-only edit rights.
- Quality-gate commands quoted in protocol/agents exist in package.json (or equivalent). In a
  greenfield repo with no manifest yet, instead mark the gates in AGENTS.md with
  `⚠️ verify scripts exist after first scaffold` and say so in the handover.
- Docs folder seeded (add `.gitkeep` to empty dirs so git tracks them); protocol §4 and the
  qa-tester checklist both reference it.

**Step 7 — Initialisation & add-ons.** On greenfield repos, run interview Phase 8: offer
production-ready standards as a menu — strict quality gates (strict TS, type-aware lint with
no-explicit-any as an error, `--max-warnings 0`, format check, a test runner with one real
test), CI on **both PR and merge** with every gate a separate step, env hygiene, and the
optional hardening items (version pinning, dependency updates, targeted coverage floors,
pre-push hook). Strict is the default; loosening needs a stated reason. Scaffold only what
the user approves (skip on repos that already have code). Then, on ALL repos, run interview Phase 9:
offer the optional third-party skill add-ons (UI/UX Pro Max, Animation Principles, web-app
testing, Superpowers, …), asking per add-on whether to install at project or user level; run
installs only after the user chooses, verify the installed path, and never block on a failed
add-on. Also offer the security-review option: built-in `/security-review` on Claude Code
(reference it in protocol + qa-tester), and for OpenCode parity a generated
`.opencode/command/security-review.md` tuned to the project's risk surfaces (see interview
Phase 9 for its required shape).

**Step 8 — Hand over.** Summarise what was generated, list the `⚠️ undecided` and `⚠️ verify`
markers to resolve, name the permission tier and where it is enforced (and, for Sandbox/Open,
that the git policy is prose-only), and remind the user: gotchas in AGENTS.md grow over the
project's life — append when a convention changes; keep every generated agent set in step.
If the repo is git-initialised, make a single scoped commit (per the fixed git policy —
committing is fine, pushing waits for the user).

## Common mistakes

| Mistake | Fix |
|---|---|
| Generating generic agents ("write clean code") | Every rule names real paths/commands/rules from the interview |
| Copying another project's facts (its DB platform, money-module path, i18n layout) into a project without them | Role blocks are parameterised — include only what THIS stack has |
| Leaving TypeScript hygiene (`any`, `console.log`, `.env.example`) in a Python/Go/Rust project | Fill `{LANGUAGE_HYGIENE_RULE}` and friends from the stack hygiene table in `engineering-standard.md` |
| Creating a `.claude/agents/project-manager.md` | PM is the main session (protocol §1); only OC gets a PM file (`mode: primary`) |
| Skipping the roster approval gate | Ownership disputes surface after generation — get approval first |
| Filling unknown business rules with plausible numbers | `⚠️ undecided — ask before implementing` markers, never guesses |
| Writing docs templates as code dumps | documentation/ is plain English for zero-context readers |
