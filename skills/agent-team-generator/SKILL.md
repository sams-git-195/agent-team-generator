---
name: agent-team-generator
description: Use when setting up the AI agent team for a project — scaffolding AGENTS.md, CLAUDE.md, .claude/agents, .opencode/agents files, an agent protocol, or project documentation structure. Triggers on "set up my agent team", "scaffold agents", "create AGENTS.md", or "new project agent setup".
---

# Agent Team Generator

Scaffolds a disciplined agent team for a project: a main agent that leads (no
project-manager file), specialist subagents for Claude Code and/or OpenCode 2 (or
harness-neutral files for another harness), an independent code-reviewer, a Fable-level
process protocol so mid-level models follow frontier-model steps, and a plain-English
`documentation/` system maintained as part of Definition of Done.

**How it works:** you interview, then write one file — `.agents/team.json` — and a script
renders every generated file from the templates. You never fill placeholders by hand.

**Principles.** The quality bar lives in the *process files*, not the model: stated lanes,
mandatory evidence, the senior ladder and self-checks make a mid-level model behave like
Fable, and every rule names real paths, commands and business rules from this project.
**Permission is not instruction:** permissions are open (allow-all), and what agents actually
do is set by protocol §6 — commit freely; push, PR, deploy, migrate a shared database or
destroy anything only when the user says so, then without re-asking.

## Files

| File | Read when |
|---|---|
| `references/interview.md` | Step 1 — intake, the summary table, the gates |
| `references/team-schema.md` + `fixtures/team.json` | Step 3 — every field of `team.json`, with a complete example |
| `references/engineering-standard.md` | Step 3 — the senior ladder and the stack hygiene table that fill `stack.*` |
| `references/greenfield.md` | Step 2 — empty repo only: gates, CI, env hygiene menu |
| `references/add-ons.md` | Step 5 — optional skills and the security-review option |
| `references/agent-skeleton.md` + `references/role-library.md` | Step 3 — custom roles only (mobile, devops, data…) |
| `references/fable-playbook.md` | Background: the behaviour the templates encode. Not needed during a run |
| `scripts/render-team.js` | Step 4 — renders everything and runs the verifier |
| `scripts/verify-team.js` | Copied into the target's `.agents/`; re-run whenever the roster changes |
| `fixtures/sample-brief.md` | Testing the skill itself only — never read during a real run |

**Baked in, never asked:** the main agent leads; open edit access with a stated lane per
agent; the user-gated list (protocol §6); the senior ladder and its floor; the senior +
security bar for product-specialist and architect; the Fable QA process for qa-tester; the
Design and Usability bars for every UI role; code-reviewer in every roster; allow-all
permissions written to `.claude/settings.json` and `opencode.json`; Sonnet for builders with
a step-up rule, Opus for judges (architect, qa-tester, code-reviewer).

## Workflow

**Step 0 — Survey.** Read the repo first (manifests, config, folder layout, design tokens,
CI, `.env.example`) so the interview never asks what the repo answers. If `.agents/team.json`
exists, this is a re-run: load it, show what it says, and ask only what changed. If any of
`AGENTS.md`, `CLAUDE.md`, `.claude/agents/`, `.opencode/agents/` (or v1 `.opencode/agent/`),
`opencode.json`, `.agents/`, `documentation/` exist, say exactly what would be overwritten and
get approval first — the renderer overwrites generated files but never existing docs.

**Step 1 — Intake and summary** (`interview.md`). One message asks for a paragraph; you turn
it plus the survey into a summary table with a source label per row, and the user corrects it.
Then one question call for the enumerable choices (harness, builder split, report style,
security review, design skill) and, on an empty repo, the greenfield menu (`greenfield.md`).
Anything the user defers becomes `⚠️ undecided` in `team.json`, never a guess.

**Step 2 — Roster proposal (approval gate).** Propose the roster: deviations from the core six
(product-specialist, architect, backend-developer, ui-ux-developer, qa-tester, code-reviewer)
with one line each; the lane map (globs per role, shared files the main agent sequences; root
manifests, lockfiles, CI and tooling config are the main agent's unless there is a
devops-engineer); the model matrix (Claude Code baselines + step-up triggers from the risk
surfaces; OpenCode selects the model on each dispatch, so no pins); and on greenfield the
prescribed conventions (client singleton path, money module, schema and test locations,
token file), labelled as proposals. **Get explicit approval before writing any file.**

**Step 3 — Write `.agents/team.json`** per `team-schema.md`, with `fixtures/team.json` beside
you as the worked example. Every field names this project's real paths, commands and rules;
`stack.*` comes from the stack hygiene table in `engineering-standard.md`; the money module,
migration rule and i18n block exist only if the stack has them; the gates list is the full
list, tests included. Custom roles get a body file (`agent-skeleton.md` + `role-library.md`)
referenced from `roles.<name>.body_file`.

**Step 4 — Render and verify.** From the target root:

```bash
node <skill-dir>/scripts/render-team.js .agents/team.json
```

It writes every file for the chosen harness(es), seeds `documentation/`, copies the verifier
to `.agents/verify-team.js` and runs it. Paste the output. A `FAIL` or a render error is fixed
in `team.json` and re-rendered — never by editing a generated file by hand. On a greenfield
repo the gate-script check passes only after Step 5 creates the manifest: re-run
`node .agents/verify-team.js` then and paste that too. Then the checks the verifier cannot do:
read `AGENTS.md` and one builder file as the agent would — every rule concrete, nothing that
could be pasted into another repo unchanged; lanes distinct; protocol §6 names every deploy
channel and never-do item; `⚠️ undecided` markers only where the user actually deferred.

**Step 5 — Scaffold and add-ons.** Greenfield: scaffold what the user approved in Step 1
(`greenfield.md`), matching the gate commands in `team.json` verbatim. All repos: install the
add-ons chosen (`add-ons.md`) at the level the user picked, verify each path, never block on a
failed install.

**Step 6 — Hand over.** Outcome first. List what was generated, the `⚠️ undecided` and
`⚠️ verify` markers, and say plainly: nothing is blocked mechanically — the user-gated list in
protocol §6 is the guard. Tell the user how to work with the team: give an instruction and
the main agent carries it through; say "push" / "deploy" to get that done; ask for "a code
review" to run the code-reviewer; edit `.agents/team.json` and re-render when the roster or a
convention changes (gotchas in `AGENTS.md` are edited directly and grow over the project's
life). If the repo is git-initialised, make one scoped commit; pushing waits for the user.

## Common mistakes

| Mistake | Fix |
|---|---|
| Generic fields ("write clean code", "the main source folder") | Every field names real paths, commands and rules from the survey and the user's answers |
| Copying the fixture's facts (Fly, Alembic, Stripe) into a project without them | `fixtures/team.json` is a worked example of the shape, not of this project |
| A TypeScript hygiene rule in a Python/Go/Rust project | `stack.*` from the hygiene table row(s) for THIS stack |
| Editing a rendered file to fix a verifier FAIL | Fix `team.json`, re-render |
| A project-manager role, or `fullstack-developer` beside the two builders | The renderer refuses both; the main agent leads |
| Filling an unknown business rule with a plausible number | `⚠️ undecided — ask before implementing` |
| Skipping the roster approval gate | Lane disputes surface after generation — approve first |
| Asking what the repo already says | Step 0 reads manifests and config; the summary table shows "from repo" rows for confirmation only |
