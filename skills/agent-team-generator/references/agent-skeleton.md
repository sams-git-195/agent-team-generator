# Agent file skeleton — shared structure for every generated agent

**For the core roles, use the full pre-filled files in `templates/` — they are the source of
truth.** This skeleton exists for composing CUSTOM roles the templates don't cover (mobile,
devops, data…): follow this exact section order. The structure is the discipline: scope
contracts and self-checks are what make mid-level models hold the line. Never omit a section;
write "N/A + reason" if truly inapplicable.

## Claude Code frontmatter (`.claude/agents/<name>.md`)

```yaml
---
name: {kebab-case-role}
description: {Third person. WHEN to use + what it owns + what it does NOT do / who owns the
  neighbouring territory. For qa-tester include "Use PROACTIVELY after any implementation task
  completes."}
tools: {Read, Grep, Glob, Bash for non-writing roles; + Edit, Write for builders. Add WebFetch
  only when the role must consult external docs — e.g. architect/qa in a project with
  third-party integrations named in the interview.}
model: {sonnet | opus per the model matrix}
---
```

## OpenCode frontmatter (`.opencode/agent/<name>.md`)

```yaml
---
name: {same-name}
description: {same description}
mode: {primary for project-manager, subagent for everyone else}
color: "{distinct hex per role}"
temperature: 0.1
model: {OC_MODEL from interview, asked PER AGENT. The project-manager (primary) gets NO model
  line — it uses OpenCode's standard model selector.}
options:                      # include this block only if the interview pinned a reasoning
  reasoning_effort: high      # effort for this agent's model; omit otherwise
permission:
  read: allow
  edit:
    "*": deny
    {one allow line per owned glob — this is the scope contract, machine-enforced. A file two
     builders may both edit (PM-sequenced) carries a trailing `# shared` comment on its allow
     line in BOTH files; the verifier treats any other builder overlap as a failure}
  {PERMISSION_POLICY_BLOCK — the team's chosen tier from `permission-policy.md` (starts with
   `bash:`; Guarded/Strict add `external_directory: ask`), byte-identical in every OC file, with
   the deploy set and Phase 5.3 adjustments resolved}
  todowrite: allow
---
```

No `steps:` cap on any agent. `color:` is not in OpenCode's documented markdown-agent field list —
keep it (harmless if ignored) but mark "verify against installed OpenCode version" in the hand-over.

**Property-based dangers**: some risks are a property of the invocation, not a command prefix —
e.g. a payments CLI in live mode (`--live` anywhere, a live API key argument, or a session
logged into a live account with no flag at all). Globs cannot capture these reliably. For any
such tool, prefer a wholesale `"tool *": ask` line over trying to enumerate dangerous shapes,
optionally plus deny lines for the obvious patterns.

## Other harnesses (interview Phase 0 = "another harness")

Write each role's **body only** (no frontmatter) to `.agents/agents/<role>.md`, project-manager
included; the scope contract stays as prose. Most harnesses read `AGENTS.md` natively; add a
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

2. **`## Scope (hard contract)`** — exact globs the role may create/edit; FORBIDDEN paths with
   the owning role named; allowed bash commands as a closed list. State that a one-character
   edit outside scope is a violation: report it instead. Non-writing roles (product-specialist,
   architect): "no edit tools by design — your report is your entire output".

3. **`## NON-NEGOTIABLE RULES`** — 6–8 numbered rules. Compose from: the role block in
   `role-library.md` + the project's risk surfaces + the relevant Fable-playbook items
   (evidence, no guesses, minimal diffs). Most important first. Each rule concrete enough to
   check compliance mechanically.

4. **`## Grounding Rules`** — the anti-hallucination set, always: read the full file before
   editing; never cite an unverified path/table/function; copy a neighbouring example; minimal
   diffs; code beats spec — flag discrepancies; stop after 2 identical failures and report
   verbatim.

5. **`## Your Workflow (follow in order)`** — 6–9 numbered steps from "Read the spec/read
   AGENTS.md" through implementation order to "run gates → self-review diff → Final Self-Check
   → hand off". This is the Fable process serialised for the role.

6. **Role-specific reference sections** — e.g. ❌/✅ code contrast for the project's most
   expensive mistake (money, RLS…), domain tables, severity definitions (qa), design principles
   (architect). Keep short; AGENTS.md holds the facts.

7. **`## Output Format`** — a literal markdown template the role copies. Reports are structured
   or they are rejected. Applies to reporting roles (product-specialist, architect, qa-tester,
   PM); builder roles' output is their diff + gate evidence + handoff, so their templates
   legitimately omit this section.

8. **`## FINAL SELF-CHECK (run before handing off)`** — checkbox list mirroring the
   non-negotiables + gates + "I read my full git diff" + "zero edits outside my allowed paths"
   + docs field respected.

9. **`## Handoff`** — "End with exactly one line:" + the literal line(s):
   `{ROLE} Complete → {next-role} ({context})` and
   `{ROLE} BLOCKED → project-manager (reason: …)`.

## Writing rules

- **Project-specific everywhere.** Generic agents don't hold the bar — every rule should name
  real paths, real commands, real business rules from the interview. If a rule could be pasted
  into any repo unchanged, sharpen it or cut it.
- **Contracts over exhortations.** "You may ONLY edit X, Y" beats "focus on X". Closed lists
  beat open descriptions.
- Subagents can't reach the user: non-PM agents put questions under "Questions for the user"
  in their report; the PM relays.
- Keep each agent file roughly 80–130 lines of **body** (the OC frontmatter permission map is
  excluded from the budget). Longer = diluted; the facts live in AGENTS.md.
- The two tools' versions are the SAME persona: same name, rules, workflow, output format.
  Only frontmatter and enforcement mechanics differ (CC = prose contract, OC = permission map —
  keep the prose contract in the OC body too; the permission map enforces it).
- OpenCode project-manager (`mode: primary`) additionally carries the PM sections from the
  protocol template §1 (plan/decompose/dispatch/track/QA loop/docs contract), since OpenCode
  has no CLAUDE.md-style auto-loaded protocol.
