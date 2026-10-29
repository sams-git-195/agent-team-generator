# {{project.name}} — Agent Guide

## Product context
- {{project.pitch}}
- Personas: {{personas_line}}
{{#project.targets}}
- Targets: {{project.targets}}
{{/project.targets}}

## How we work
**Full process: `.agents/rules/claude-agent-protocol.md` — read it before your first task.**
{{#has_cc}}(Claude Code loads it through `CLAUDE.md`; every other harness reads it explicitly.) {{/has_cc}}The short version, which holds even if you read nothing else:

- **The main agent leads.** No project-manager agent: the session talking to the user plans,
  dispatches the specialists below, tracks their evidence and reports back. Prefer
  dispatching; a small, quick, single-discipline change with no risk surface may be done
  directly — after reading that specialist's file and following its rules and self-check.
- **Open permissions, user-gated actions.** Agents edit any file, run any command the task
  needs, and commit freely. They `git push`, open or merge PRs, deploy
  ({{gated.deploy_commands}}), migrate a shared database or delete anything **only when the
  user has said so in this conversation** — and then without asking again. Not asked yet →
  finish, commit, offer the exact command. {{stack.secret_files}} may be read and updated;
  its values never reach a commit, a log or a report.
- **Stay in your lane.** Each agent focuses on what it owns (table below). A small adjacent
  edit the task needs is fine and is named in the report; anything larger goes to its owner.
- **Senior ladder before any code:** (1) does this need to exist? (2) already in this
  codebase — reuse it; (3) does an installed dependency do it; (4) can it be one line;
  (5) only then the minimum that works — **never** dropping error handling, graceful
  user-facing errors or any part of the user experience.
- **Evidence, not claims.** Gates are run and their output quoted. Unknown business rules are
  asked, never guessed.
- **Reports to the user:** {{report_style}} depth, protocol §7 shape (outcome first, no preamble).

## Agent team
| Agent | Focus (owns) | Hands off to |
|---|---|---|
| **Main agent** (the session itself — no file) | Plans, dispatch, tracking, small direct changes; `AGENTS.md`, agent files, roadmaps; **shared root files** — {{protocol.shared_root_files}} — edited itself or assigned to one builder at a time | all agents |
{{#roster_rows}}
| {{name}} | {{focus}} | {{handoff}} |
{{/roster_rows}}

{{#has_both}}
Claude Code: agents live in `.claude/agents/*.md`, permissions in `.claude/settings.json`.
OpenCode: the same team in `.opencode/agents/*.md`, permissions in `opencode.json`; the main
agent is OpenCode's default `build` agent. When a convention changes, update both sets
together — same roster, same rules.
{{/has_both}}
{{^has_both}}
{{#has_cc}}
Agents live in `.claude/agents/*.md`, permissions in `.claude/settings.json`.
{{/has_cc}}
{{#has_oc}}
Agents live in `.opencode/agents/*.md`, permissions in `opencode.json`; the main agent is
OpenCode's default `build` agent.
{{/has_oc}}
{{#has_neutral}}
Persona files live in `.agents/agents/*.md` (harness-neutral). Adopt the matching persona
before any task; dispatch mechanics for {{other_harness.name}}: ⚠️ verify.
{{/has_neutral}}
{{/has_both}}

## Dev commands
{{#commands.list}}
- `{{cmd}}` — {{note}}
{{/commands.list}}
- **Quality gates: {{gate_commands}} — {{commands.gates_note}}**

## Critical gotchas
{{agents_md.gotchas}}

## Architecture
{{agents_md.architecture}}

## Business rules
{{agents_md.business_rules}}

{{#project.has_ui}}
## UI
- **Design direction:** {{design.direction_or_marker}}
- Tokens: {{design.token_source}} · Colors: {{design.palette}} · Type: {{design.fonts}}
- {{design.conventions}}; verify at {{stack.breakpoints}}
{{#design.skills}}
- Load the `{{.}}` skill before any UI work.
{{/design.skills}}
- Generic-looking or hard-to-use UI is a defect here: the Design bar and Usability bar in the
  UI developer's agent file apply to every screen, whoever builds it.
{{/project.has_ui}}

{{#agents_md.data_section_name}}
## {{agents_md.data_section_name}}
{{agents_md.data_rules}}
{{/agents_md.data_section_name}}

## Documentation
Plain-English living docs in `documentation/` (protocol §4): `README.md` index +
`pages/<page>.md` + `features/<feature>.md` + `known-issues.md`. Updated by whoever makes the
change, confirmed by the main agent before any feature is Done; qa-tester verifies.
