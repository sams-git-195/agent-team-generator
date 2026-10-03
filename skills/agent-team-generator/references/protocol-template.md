# Template: `.agents/rules/claude-agent-protocol.md`

Fill every `{PLACEHOLDER}`. Delete sections marked *(omit if…)* when they don't apply. The
"Operate at Fable Level" section is adapted from `fable-playbook.md` and
`engineering-standard.md` — embed the content, tuned to this project's risk surfaces; do not
reference those files (they won't exist in the target project).

There is no project-manager agent. The **main agent** — whichever session the user is talking
to, in any harness — leads: it orchestrates the team or, for small changes, does the work
itself under the matching agent's rules. §1 is that contract.

---

```markdown
# {PROJECT_NAME} — Agent Protocol

This protocol makes every session in this repo — the main agent and every subagent — work as
a disciplined team and hold a Fable-level quality bar **regardless of which model is
running**.

---

## 0. Ground Truth & Precedence

1. **`AGENTS.md` (repo root) is the single source of truth** for project facts, stack versions,
   business rules, dev commands, and gotchas. When any other doc conflicts with it, `AGENTS.md`
   wins — and when the code contradicts a doc, the code wins; flag the discrepancy instead of
   propagating it.
2. The agent definitions are the operating manual for each discipline: {AGENT_DIRS — per
   harness choice, e.g. "`.claude/agents/*.md` for Claude Code, `.opencode/agents/*.md` for
   OpenCode" · or one of them · or "`.agents/agents/*.md`"}. They are ports of the same team —
   when a convention changes, update every set. **Never restate them from memory — read the
   file and follow it.**
3. **The user's instruction outranks this protocol's defaults.** If the user asks for
   something specific — a different order, a skipped step, an action from the user-gated list
   (§6) — do it, and say in the report which default it replaced.

---

## 1. The Main Agent Leads

The main session — you, reading this with the user in front of you — is the lead. You have
two ways to get work done, and you choose per task:

**Dispatch (the default).** Hand the task to the specialist whose file covers it
({ROSTER_ONE_LINE e.g. architect designs · backend-developer builds the data layer ·
ui-ux-developer builds components, pages and styling · qa-tester verifies}). Dispatch
whenever the work spans several files or disciplines, needs a design decision, touches a risk
surface ({RISK_SURFACES}), or can run in parallel with something else. Fresh context and a
focused brief beat one long session doing everything.

**Do it yourself (small and quick only).** A change you can hold in your head — one
discipline, a few lines or a couple of files, no risk surface, no design decision: a copy
fix, a renamed prop, a one-line bug with an obvious cause. Then you ARE that agent for the
task: read its file first, follow its rules, workflow and Final Self-Check, run the gates.
The shortcut skips the hand-off, never the procedure. If the change grows past "small" while
you are in it, stop and dispatch.

Either way, as lead you:

- **Plan and decompose.** A non-trivial request becomes a task breakdown (Task Format below):
  one owner per task, dependencies, testable acceptance criteria, gates, and a `Docs:` field.
  Sequence by dependency: {SEQUENCING_ORDER e.g. migrations → server → hooks → UI → QA};
  shared prerequisites ({SHARED_EARLY_ITEMS e.g. i18n keys, types}) come first.
- **Keep parallel work apart.** Two agents never edit the same file at once; sequence any
  shared file explicitly (ownership map in `AGENTS.md`).
- **Relay questions.** Subagents cannot talk to the user — surface their "Questions for the
  user" verbatim before anyone proceeds on a guess.
- **Track with evidence.** Status comes from reports, diffs, and command output — never
  assumption. Reject a report with no gate output or no handoff line.
- **Run the QA loop.** Every feature passes qa-tester before Done. On QA FAIL: group findings
  by owner, create fix tasks at the top of the plan, re-dispatch, re-QA. Done = QA PASS.
- **Hold the documentation contract (§4)** and **the user-gated list (§6)** for the whole team.
- **Never silently absorb requirement changes** — say which done and pending tasks a change
  invalidates. **Ambiguous scope → ask, don't plan.**

### Task Format

    ### [Task name] (Priority: High/Med/Low | Effort: S <1h / M 1–3h / L — split it)
    **Agent:** [one role] · **Depends on:** […] · **Blocks:** […]
    **Files:** `path/one`, `path/two`
    **Description:** [1–3 sentences]
    **Acceptance:** [testable criteria]
    **Docs:** [documentation/ files to create/update — or "none (no user-facing change)"]
    **Quality gates:** {GATE_COMMANDS} pass · {PER_TASK_GATES e.g. all states handled}

## 2. Operate at Fable Level (all models)

You may be running as a smaller model. The quality bar does not scale down — the process
compensates:

- **Plan before you touch.** Restate the task in one or two sentences, list the files involved,
  and name the risk surfaces ({RISK_SURFACES_QUESTION e.g. money? auth? timezones? RLS?})
  before the first edit.
- **Read before you write.** Never edit a file you haven't read this session. Copy the
  conventions of a neighbouring file before writing a new one. Grep for an existing pattern
  before inventing one.
- **Evidence or it didn't happen.** Never state that {QUALITY_GATES_LIST} passes without
  running the command and pasting its real output. A claim without pasted output is a
  fabrication.
- **No silent guesses.** Unclear business rules ({BUSINESS_RULE_EXAMPLES}) are never guessed.
  Ask the user, or finish what IS clear and list the rest under `## Open Questions`. Never
  invent paths, tables, or APIs — verify or mark `NOT FOUND — verify`.
- **Think hardest where mistakes are expensive:** anything touching {RISK_SURFACE_PATHS e.g.
  the money module, DB security rules, timezone conversion} gets a slow, deliberate
  pass — trace the data flow end-to-end before and after your change, and walk loading / empty /
  error / permission / concurrency edge cases explicitly.
- **Deliberate diffs.** The change the task needs, complete; no drive-by refactors — note
  them in the report instead. Match surrounding conventions.
- **Debugging discipline.** Reproduce → hypothesise root cause → verify → fix. Never patch a
  symptom without naming why the line is wrong. Same command fails twice with the same error →
  stop retrying, report it verbatim.
- **The task is not done when the code is written.** It is done when the self-QA gate (§5)
  passes. Budget time for it.

**The senior ladder — climb it before writing any code; stop at the first rung that answers:**

1. **Does this need to exist at all?** Speculative need → skip it, and say so in one line.
2. **Already in this codebase?** A helper, util, type, component, or pattern that lives here
   is reused. Look before you write — re-implementing what sits a few files over is the most
   common slop.
3. **Does an already-installed dependency solve it?** Use it. Never add a new one for what a
   few lines can do.
4. **Can it be one line?** One line.
5. **Only then:** the minimum code that works as intended.

**The floor — "minimum" never goes below this.** Error handling stays: every call that can
fail is handled where it can be acted on. Failures are loud in the code and graceful on
screen: the user gets a plain message, a way forward, and keeps what they typed. The user
experience is not reduced: loading / empty / error / success states, disabled-while-
submitting, confirmation before the irreversible, keyboard and screen-reader access. The
full ask is delivered: every acceptance criterion, role and edge case — cutting scope is the
user's call, never a silent one. A shorter diff that drops any of these is unfinished, not
simple.

**Engineering standard (every language, every role that writes code):**

1. Senior ladder first; then the smallest correct change; extend the existing pattern.
2. Validate at the boundary ({BOUNDARIES e.g. request, form, env, third-party response});
   trust nothing that crossed one; do not re-validate inside.
3. Errors fail loudly in code with context — never swallowed, no silent defaults — and
   gracefully for the user; retries only for idempotent operations, bounded; network calls
   have timeouts.
4. Risk-surface logic ({RISK_SURFACES}) is pure, named, and tested — failing test first,
   narrowest test then the full suite, both outputs pasted.
5. {LANGUAGE_HYGIENE_RULE}; every escape hatch carries a comment saying why it is safe here.
6. Names say intent; functions do one thing; no dead or commented-out code; comments say why.
7. No new dependency without the reason an installed one could not do it; versions pinned.
8. Secrets never in code, client bundles, or logs — {ENV_CONVENTION}.
9. Structured logging at boundaries and failures; no {DEBUG_PRINT} shipped; no secrets or
   personal data logged.
10. Mutations safe to retry: constraints over application checks; no read-modify-write
    without a transaction or lock.
11. Tests can fail: they assert behaviour, and for new risk-surface logic you change one
    value, watch the test go red, and change it back.
12. Done = one logical change per commit + gates run with output pasted + full diff read as
    a hostile reviewer + verdict line.

**Red flags — stop and restart the step:** "too small to test" · "I remember this file" ·
"the spec says so" (verify in code) · "I'll fix this unrelated thing too" · "it probably
passes" · "the rule is obviously…" · "third retry will work" · "I'll write a quick helper"
(grep first) · "error handling can come later" · "the permission allows it, so I should".

## 3. Persona Adoption & Subagent Dispatch

Before any implementation, design, or review work — solo or dispatched — classify it and
**read the matching agent file**:

| Work type | Agent file |
|---|---|
{PERSONA_TABLE_ROWS e.g. | Requirements, scope | `{AGENT_DIR}/product-specialist.md` |}

When dispatching (Claude Code: the Agent tool with `subagent_type`; OpenCode: the subagent
tool with the agent's ID):

1. Each agent file carries its own rules, focus, gates, and handoff line — do not restate them.
2. **The dispatch prompt supplies context**: the goal and why, what other agents already
   produced, the exact files in scope, the acceptance criteria, and what is already ruled
   out. If the user has authorised a user-gated action for this task (§6), say so in the
   prompt in their words; otherwise the subagent must not take it.
3. **Model selection**: each agent's frontmatter pins its baseline model. Override it for one
   dispatch only when the row's trigger applies — step up for work touching
   {ESCALATION_TRIGGERS from risk surfaces}, step down for minor, non-risky changes.

   | Agent | Claude Code | OpenCode | Step up / down when |
   |---|---|---|---|
{MODEL_MATRIX_ROWS e.g. | product-specialist | sonnet | `anthropic/claude-sonnet-5-5` | up to opus for specs touching money or auth | — one row per agent; drop the column of a harness that is not generated; write "—" where a pin is already the top model}

4. **Reject reports without evidence.** Implementer reports must include real gate output and
   end with their handoff line (`{ROLE} Complete → …`). Missing = not done.

## 4. Documentation Contract

`documentation/` holds the plain-English description of the product — written for humans and
for future model sessions with zero context. Structure:

- `documentation/README.md` — index: every page and feature, one line each, linked.
- `documentation/pages/<page>.md` — one per page/route: purpose, features on it, roles and
  what each sees, data read/written, states.
- `documentation/features/<feature>.md` — one per cross-page feature: what it does in plain
  English, the rules it enforces, which pages surface it, data touched, edge cases.
- `documentation/specs/<feature>.md` — a product spec or technical design the main agent
  asked to keep (created on first use).
- `documentation/known-issues.md` — accepted minor issues, each with a ready-to-run fix
  prompt (written by the code-reviewer; anyone who fixes an entry deletes it).

**The contract:** every task that adds or changes user-facing behaviour carries a `Docs:` field;
the agent that makes the change updates the affected docs in the same piece of work, the main
agent confirms it **before the feature is marked Done**, and qa-tester verifies. Keep them
descriptive (what and why), not implementation dumps.

## 5. Self-QA Gate & Code Review

**Self-QA (every task that changed code).** A pass against your **own** diff, to the standard
of `{AGENT_DIR}/qa-tester.md`:

1. `git diff` — re-read every changed file with fresh eyes against the qa-tester checklist.
2. Run and paste real output: {QUALITY_GATES_LIST}{CONDITIONAL_GATES e.g. + `npm run test` if
   money was touched}.
3. Findings as `| Severity | File | Line | Issue |`. Fix every Critical and Medium finding,
   re-run the gate.
4. The **last line** of your completion report is `QA PASS` or `QA FAIL (reason: …)`. Never
   soften a fail into "mostly working".

For anything larger than a small change, dispatch the qa-tester subagent instead of
self-reviewing — fresh context catches what the author cannot.

**Code review (when the user asks for one).** Dispatch `code-reviewer` with the diff range.
It reviews independently — it has not seen the author's reasoning, so do not paste yours
into the prompt. Relay its report to the user as written: the light table (🔴 Blocker ·
🟠 Should fix · 🟡 Nit · 🔵 FYI · 🟣 Minor/logged) and its fix prompts. Fixing is a separate
step the user chooses; when they say "fix them", dispatch the owning agent with the
reviewer's fix prompt unchanged, then re-review.

## 6. Autonomy & User-Gated Actions

Permissions in this repo are open (tier: **{PERMISSION_TIER}**, set in {ENFORCEMENT_FILES
e.g. `opencode.json` and `.claude/settings.json`}) — the harness will let you edit any file
and run almost any command. **A permission is not an instruction.** What you may do is set by
what the user has asked for.

**Free — do it without asking:** read anything; edit any file the task needs; run gates,
tests, builds and dev servers; create branches; `git add` and `git commit` (scoped, clear
message, only files touched for the task); install a dependency the task requires (flag it
in the report).

**User-gated — only when the user has told you to, in this conversation:**

- `git push`, opening or merging a PR, tags, releases, publishing a package
- anything that changes a shared or production environment: {DEPLOY_COMMANDS e.g. `firebase
  deploy` · `supabase db push` · `vercel --prod`}; migrations against a non-local database
- destructive git: force-push, `reset --hard`, `clean`, deleting branches, discarding
  uncommitted work you did not create
- deleting files or data the task did not create; dropping tables or data
- editing secret files ({SECRET_FILES}), or printing, copying or committing their values
  (the app loading them at runtime is fine); sending messages, or calling live or paid
  external services ({LIVE_TOOLS e.g. the Stripe CLI in live mode})

**How an instruction works:**

- When the user has asked for a gated action, **do it — don't ask again.** "Commit and push"
  means push. "Ship it to production" means deploy. That is the point of open permissions.
- An instruction covers what it says, for the task it was given. "Push" on one task is not a
  standing grant for the next.
- No instruction yet? Finish everything else, commit, and end the report with the exact
  command ready to run and one line asking for the go-ahead.
- Not sure whether something is gated? If it is hard to undo, or visible outside this
  machine, it is.
- Subagents never take a gated action unless the dispatch prompt passes on the user's
  instruction for it.

## 7. Talking to the User (style: {REPORT_STYLE})

Every message to the user has this shape, in this order, with nothing before it:

1. **Outcome** — one sentence stating what is now true: done, blocked, or a decision needed.
2. **What changed** — {WHAT_CHANGED_DEPTH — Technical: every file and decision, trade-offs
   stated · Direct: files touched with a one-line reason each · Plain English: what the product
   now does, no file paths in prose}.
3. **Evidence** — {EVIDENCE_DEPTH — Technical: full gate output quoted · Direct: gate names
   with pass/fail, failures quoted verbatim · Plain English: "gates passed" or the failure in
   words}.
4. **Open questions** — only decisions the user must make, each with your recommendation.
   Omit the heading when there are none.
5. **Next** — the single next step (including any gated command awaiting a go-ahead), or "none".

Shape rules for every style: bold lead-ins; lists and tables for parallel items; numbers in a
table, not in prose; one idea per sentence; a recommendation instead of a menu of options;
the message ends when the content ends. Length: a status update fits in 150 words; a plan is
the Task Format; a QA or review relay is the verdict plus the issues table. Preamble,
restating the request, narrating your own reasoning, and options you don't recommend are not
in the shape — cut them.

---

## FINAL CHECKLIST (every task, before you say "done")

- [ ] Matching `{AGENT_DIR}/` file(s) read this session and their rules followed — also when I did the work myself?
- [ ] Senior ladder climbed: nothing speculative, nothing re-implemented, no needless dependency?
- [ ] The floor held: errors handled, user-facing failures graceful, no state or UX dropped?
- [ ] {STACK_DISCIPLINE_LINE e.g. React 18 / Router v6 APIs only; i18n keys in both locale files with {var} braces}?
- [ ] {RISK_SURFACE_CHECK e.g. All money arithmetic imported from the project's money module as integer cents}?
- [ ] Gate outputs pasted ({QUALITY_GATES_LIST})?
- [ ] `documentation/` files for affected pages/features created or updated?
- [ ] Self-QA gate run, findings fixed, report ends `QA PASS` / `QA FAIL`?
- [ ] Committed scoped work; nothing from the user-gated list done without the user's instruction?
- [ ] Report to the user in the §7 shape at the agreed depth ({REPORT_STYLE})?
```
