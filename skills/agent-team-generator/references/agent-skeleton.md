# Agent file skeleton — shared structure for every generated agent

**For the core roles, use the full pre-filled files in `templates/` — they are the source of
truth.** This skeleton exists for composing CUSTOM roles the templates don't cover (mobile,
devops, data…): follow this exact section order. The structure is the discipline: a stated
focus, checkable rules, and a self-check are what make mid-level models hold the line. Never
omit a section; write "N/A + reason" if truly inapplicable.

There is no project-manager file in any harness: the main session leads (protocol §1).

## Claude Code frontmatter (`.claude/agents/<name>.md`)

```yaml
---
name: {kebab-case-role}
description: {Third person. WHEN to use + what it owns + what it does NOT do / who owns the
  neighbouring territory. For qa-tester include "Use PROACTIVELY after any implementation task
  completes."; for code-reviewer "Use ONLY when the user asks for a code review".}
model: {sonnet | opus per the model matrix}
---
```

No `tools:` line — omitting it lets the agent inherit every tool, MCP servers included (the
UI developer needs browser tools; any agent may need web docs). What an agent *should* touch
is its "Scope & focus" section; what the session *may* do is `.claude/settings.json`.

## OpenCode 2 frontmatter (`.opencode/agents/<name>.md`)

```yaml
---
description: {same description}
mode: subagent
model: {OC_MODEL from interview, asked PER AGENT, as `provider/model-id#variant` — e.g.
  `anthropic/claude-opus-5-5#high`. The variant (reasoning effort) is part of the string;
  drop `#variant` when the model has none.}
color: "{distinct six-digit hex per role}"
---
```

What changed from OpenCode 1, so nothing stale is generated:

| OpenCode 1 | OpenCode 2 |
|---|---|
| `.opencode/agent/` | `.opencode/agents/` |
| `name:` in frontmatter | none — the filename is the agent ID |
| `model:` + separate `options.reasoning_effort` / `variant` | `model: provider/model#variant` |
| `temperature: 0.1` at top level | `request.body.temperature` (omitted by default — several current models reject it; add a `request:` block only if the user asks) |
| `permission:` map (`bash:`, `task:`, `edit:` globs) | `permissions:` rule list (`shell`, `subagent`, `edit`), last match wins — written ONCE in `opencode.json`, not per agent |
| `tools:` booleans | gone — use permissions |
| a `mode: primary` project-manager file | none — OpenCode's built-in `build` agent is the main agent and reads `AGENTS.md` |

No `steps:` cap on any agent. Every agent is `mode: subagent`. Agent files carry no
`permissions:` list: agent rules are *appended* to the global list, so a per-agent list can
only drift from the one policy. See `permission-policy.md`.

## Other harnesses (interview Phase 0 = "another harness")

Write each role's **body only** (no frontmatter) to `.agents/agents/<role>.md`; the focus
section stays as prose. Most harnesses read `AGENTS.md` natively; add a
pointer file only where the harness has its own instruction file. Verify each row against the
harness's current docs before writing — mark the file `⚠️ verify` if unsure.

| Harness | Reads `AGENTS.md`? | Pointer file to write |
|---|---|---|
| Codex CLI | yes | none |
| Gemini CLI | via import | `GEMINI.md` containing `@AGENTS.md` and `@.agents/rules/claude-agent-protocol.md` |
| Cursor | yes | `.cursor/rules/agent-protocol.mdc` (`alwaysApply: true`) — two lines: read `AGENTS.md`, then the protocol, before any task |
| GitHub Copilot | yes | `.github/copilot-instructions.md` — the same two lines |
| unknown | ask | the same two lines in whatever file the user names |

## Section order (the body, both tools)

1. **`# Role Name`** + intro paragraph: "You are the {role} for **{PROJECT}**, {one-line pitch
   + stack parenthetical}. You {core responsibility}. {What you do NOT do and who does}."
   Point at `AGENTS.md` for project facts — "apply them, don't restate them".

2. **`## Scope & focus`** — "Your lane": the exact globs the role works in and answers for;
   the neighbouring lanes with their owning role named. Every agent has edit access to the
   whole repo, so say what that access is for: a small adjacent change the task needs is the
   agent's to make and is listed under "Outside my lane" in its report; anything larger is a
   handoff. Reporting roles (product-specialist, architect, qa-tester, code-reviewer) state
   the narrow thing they do write (a spec file, tests, `known-issues.md`) and that they do
   not fix production code. Close with the user-gated paragraph (protocol §6): commit
   freely; push, PRs, deploys, destructive commands and secrets only on the user's
   instruction passed through the dispatch prompt — and then without asking again.

3. **`## NON-NEGOTIABLE RULES`** — 6–8 numbered rules. Compose from: the role block in
   `role-library.md` + the project's risk surfaces + the relevant Fable-playbook items
   (evidence, no guesses, the senior ladder and its floor). Most important first. Each rule concrete enough to
   check compliance mechanically.

4. **`## Grounding Rules`** — the anti-hallucination set, always: read the full file before
   editing; never cite an unverified path/table/function; the senior ladder in one bullet
   (need → reuse → installed dependency → one line → minimum, never below the floor of error
   handling and user experience); copy a neighbouring example; deliberate diffs; code beats
   spec — flag discrepancies; stop after 2 identical failures and report
   verbatim.

5. **`## Your Workflow (follow in order)`** — 6–9 numbered steps from "Read the spec/read
   AGENTS.md" through implementation order to "run gates → self-review diff → Final Self-Check
   → hand off". This is the Fable process serialised for the role.

6. **Role-specific reference sections** — e.g. ❌/✅ code contrast for the project's most
   expensive mistake (money, RLS…), domain tables, severity definitions (qa), design principles
   (architect). Any role that builds UI carries the `## Design bar` block from
   `design-standard.md`. Keep the rest short; AGENTS.md holds the facts.

7. **`## Output Format`** — a literal markdown template the role copies. Reports are structured
   or they are rejected. Applies to reporting roles (product-specialist, architect, qa-tester,
   code-reviewer); builder roles' output is their diff + gate evidence + handoff, so their templates
   legitimately omit this section.

8. **`## FINAL SELF-CHECK (run before handing off)`** — checkbox list mirroring the
   non-negotiables + gates + "senior ladder climbed, floor held" + "I read my full git diff" +
   "anything outside my lane is listed" + "nothing user-gated done without the user's
   instruction" + docs field respected.

9. **`## Handoff`** — "End with exactly one line:" + the literal line(s):
   `{ROLE} Complete → {next-role} ({context})` and
   `{ROLE} BLOCKED → main agent (reason: …)`.

## Writing rules

- **Project-specific everywhere.** Generic agents don't hold the bar — every rule should name
  real paths, real commands, real business rules from the interview. If a rule could be pasted
  into any repo unchanged, sharpen it or cut it.
- **Name the lane precisely.** Access is open, so the words carry the weight: "Your lane is
  X, Y; Z belongs to backend-developer" beats "focus on the frontend". Real globs, real
  owners, and a stated rule for the adjacent edit.
- **Say why, not just what.** A rule with its reason ("fixing it yourself hides the finding
  from its owner") holds on a mid-level model better than a bare prohibition.
- Subagents can't reach the user: they put questions under "Questions for the user" in their
  report; the main agent relays.
- Keep each agent file roughly 80–140 lines of **body** (UI roles run longer — the Design bar
  is ~45 lines and earns it). Longer = diluted; the facts live in AGENTS.md.
- The two tools' versions are the SAME persona: same rules, workflow, output format. Only the
  frontmatter differs.
