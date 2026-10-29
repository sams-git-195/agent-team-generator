# Agent file skeleton — for custom roles only

The core roles are complete templates. A custom role (mobile, devops, data…) gets a body
file at `.agents/roles/<name>.md` — no frontmatter; the renderer adds the Claude Code
frontmatter (`name`, `description`, `model`) and the OpenCode 2 frontmatter (`description`,
`mode: subagent`, `model: provider/model#variant`, `color`) from `roles.<name>` in
`team.json`, and writes the body to every harness's agent directory. `{{tags}}` from
`team-schema.md` and the partials (`{{> gated-builder}}`, `{{> grounding}}`,
`{{> design-bar}}`) work in the body. No `tools:` line, no per-agent permissions, no
`temperature` — ever.

The structure is the discipline: a stated lane, checkable rules and a self-check are what
make mid-level models hold the line. Follow this order; never omit a section — "N/A +
reason" if truly inapplicable.

1. **`# Role Name`** + intro: "You are the {role} for **{{project.name}}**, {{project.pitch}}
   ({{project.stack}}). You {core responsibility}. {What you do NOT do and who does}." Point
   at `AGENTS.md` for project facts — apply them, don't restate them.
2. **`## Scope & focus`** — "Your lane": the exact globs the role works in and answers for;
   the neighbouring lanes with their owner named; a small adjacent change the task needs is
   the agent's to make and is listed under "Outside my lane"; anything larger is a handoff.
   Reporting roles name the narrow thing they do write (a spec, tests, `known-issues.md`) and
   that they do not fix production code. Close with `{{> gated-builder}}` (builders) or "You
   take no user-gated action (protocol §6)" (reporters).
3. **`## Non-negotiable rules`** — 6–8 numbered rules, most important first, each concrete
   enough to check mechanically: the role's own rules from `role-library.md` + this project's
   risk surfaces ({{risk.surfaces}}) + "unclear rule → stop and report".
4. **`{{> grounding}}`** for builders; reporters write three lines: verify before citing,
   grep before proposing, code beats spec.
5. **`## Your workflow (follow in order)`** — 6–9 numbered steps from "read the spec /
   `AGENTS.md`" through implementation order to "run {{gate_commands}} → read the full diff
   as a hostile reviewer → self-check → hand off".
6. **Role-specific sections** — a ❌/✅ contrast for the role's most expensive mistake in the
   stack's real syntax; `{{> design-bar}}` if the role builds UI; a lights note (protocol §5)
   if it grades.
7. **`## Output format`** — reporting roles only: a literal template the role copies.
8. **`## Final self-check (before handing off)`** — checkboxes mirroring the rules + gates +
   "senior ladder climbed, floor held" + "full `git diff` read" + "anything outside my lane
   listed" + "nothing user-gated done without the user's instruction".
9. **`## Handoff`** — "End with exactly one line:" + `{Role} Complete → main agent (…)` and
   `{Role} BLOCKED → main agent (reason: …)`.

**Writing rules.** Project-specific everywhere: if a rule could be pasted into any repo
unchanged, sharpen it or cut it. Name the lane precisely — access is open, so the words carry
the weight. Say why, not just what: a rule with its reason holds on a mid-level model better
than a bare prohibition. Subagents cannot reach the user: questions go under "Questions for
the user" in the report. Keep the body around 80–140 lines (UI roles run longer — the Design
bar earns it); the facts live in `AGENTS.md`.

**Other harnesses** (`harness: "other"`): the renderer writes body-only files to
`.agents/agents/` and a pointer file for Gemini CLI (`GEMINI.md`), Cursor
(`.cursor/rules/agent-protocol.mdc`) and Copilot (`.github/copilot-instructions.md`); Codex
CLI reads `AGENTS.md` natively. Anything else: `other_harness.pointer_file`. Dispatch
mechanics for the harness are marked `⚠️ verify` in the protocol.
