# agent-team-generator

An agent skill (the open [`SKILL.md` format](https://agentskills.io) — Claude Code, OpenCode,
Codex CLI, Cursor, Gemini CLI and others load it) that scaffolds a complete, disciplined AI
agent team for your project:

- a **one-message interview**: describe the product and stack in a paragraph, the skill reads
  the repo for the rest, shows you a summary table to correct, and asks only the real choices
  (harness, separate **backend + UI developers** or a single **full-stack developer**, how the
  main agent reports to you, security review, a design skill)
- **one file, rendered**: your answers go into `.agents/team.json` and `render-team.js` writes
  everything from the templates — no hand-filled placeholders, re-render when the roster
  changes
- `AGENTS.md` + `CLAUDE.md` foundation files
- specialist subagents for **Claude Code** (`.claude/agents/`), **OpenCode 2**
  (`.opencode/agents/`, model chosen on each dispatch) or **another harness**
  (`.agents/agents/` + a pointer file), each with a stated lane and per-project non-negotiables
- a **Fable-level process protocol** (`.agents/rules/claude-agent-protocol.md`) so mid-level
  models follow frontier-model steps — the quality bar lives in the process files, not the
  model — with a language-agnostic **engineering standard** and per-stack hygiene rules
  (TypeScript, Python, Go, Rust)
- the **senior ladder**, in every agent that writes code: does it need to exist → is it
  already in the codebase → does an installed dependency do it → can it be one line → only
  then the minimum that works — with a floor that never drops error handling, graceful
  user-facing errors, or user experience
- a **Design bar** and a **Usability bar** in every agent that builds UI — a design direction
  before any pixels, tokens, designed states, whole pages, a slop list, steps counted against
  the product's core flows, Hick's / Fitts's / Jakob's laws, WCAG 2.2 — plus recommended
  design skills (`frontend-design`, [Impeccable](https://github.com/pbakaus/impeccable),
  [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill))
- an independent **code-reviewer** you run on request: it reviews the diff and the code
  around it, grades findings 🔴 Blocker / 🟠 Should fix / 🟡 Nit / 🔵 FYI / 🟣 Minor, proves
  the tests can fail by changing a value, logs minor issues to
  `documentation/known-issues.md` (only ones a real user or admin can actually hit), and hands
  back a ready-to-run fix prompt
- **open permissions, user-gated actions**: agents may edit any file and run any command, so
  an instruction is carried through without prompts — and they commit freely but push, open
  PRs, deploy, migrate a shared database or destroy anything only when you say so, then
  without re-asking. Nothing is blocked mechanically; the protocol is the guard
- **Sonnet builders, Opus judges**: builders run on the cheaper model for well-scoped tasks
  and step up on risk surfaces, multi-module changes or design decisions; architect, QA and
  reviewer always run on the strong model
- a **mechanical verifier** (`.agents/verify-team.js`) left in your repo
- a plain-English `documentation/` system maintained as part of Definition of Done
- optional third-party **skill add-ons** and a security-review command for OpenCode parity
  with Claude Code's built-in `/security-review`

There is no project-manager agent. The **main agent** — the session you are talking to —
leads: it dispatches the specialists and, for small quick changes, does the work itself under
that specialist's rules. Small tasks off a risk surface rely on the builder's self-QA; larger
ones and anything on a risk surface go through the qa-tester.

## Install

```bash
npx agent-team-generator
```

That copies the skill to `~/.claude/skills/agent-team-generator` (Claude Code, every project).
Add `--project` to install into the current repo instead. The skill is a standard
[Agent Skill](https://agentskills.io) (`SKILL.md`), so `--harness` targets other harnesses:

| `--harness` | global                      | `--project`         |
| ----------- | --------------------------- | ------------------- |
| `claude`    | `~/.claude/skills`          | `.claude/skills`    |
| `opencode`  | `~/.config/opencode/skills` | `.opencode/skills`  |
| `codex`     | `~/.agents/skills`          | `.agents/skills`    |
| `cursor`    | `~/.cursor/skills`          | `.cursor/skills`    |
| `gemini`    | `~/.gemini/skills`          | `.gemini/skills`    |
| `agents`    | `~/.agents/skills`          | `.agents/skills`    |

`agents` is the shared location that OpenCode, Codex, Cursor and Gemini CLI all scan. For
anything else, `--to <dir>` installs into `<dir>/agent-team-generator`.

Other flags: `--force` (overwrite an existing install), `--uninstall`, `--help`.

To upgrade to the latest version:

```bash
npx agent-team-generator@latest --force
```

Or install as a **Claude Code plugin** (no Node required) — inside Claude Code run:

```
/plugin marketplace add sams-git-195/agent-team-generator
/plugin install agent-team-generator@agent-team-generator
```

## Use

Open your harness in the project you want an agent team for and run `/agent-team-generator`
(Claude Code) or just say "set up my agent team". The skill surveys the repo, asks for one
paragraph, shows a summary to correct, proposes a roster for approval, writes
`.agents/team.json`, renders every file and runs the verifier. Unknowns become explicit
`⚠️ undecided` markers — never guesses. To change the team later, edit `.agents/team.json`
and run `node <skill-dir>/scripts/render-team.js .agents/team.json` again.

## Repo layout

| Path | What |
|---|---|
| `skills/agent-team-generator/SKILL.md` | The skill entrypoint (survey → intake → roster → team.json → render → verify → hand over) |
| `skills/agent-team-generator/references/` | Interview, `team-schema.md`, engineering standard (hygiene table), greenfield menu, add-ons, Fable playbook, custom-role skeleton + library |
| `skills/agent-team-generator/references/templates/` | The rendered files: protocol, AGENTS.md, every core role, docs seeds, the security-review command; `partials/` (Design bar, grounding, user-gated rule) |
| `skills/agent-team-generator/scripts/render-team.js` | Renders a team from `team.json` and runs the verifier |
| `skills/agent-team-generator/scripts/verify-team.js` | Mechanical post-generation checks; copied into the target's `.agents/` |
| `skills/agent-team-generator/fixtures/` | `team.json` (a complete worked example, also the smoke test's input) and a canned brief for testing the skill |
| `bin/cli.js` | The `npx` installer (`--harness` presets, `--to`) |
| `.claude-plugin/` | Plugin + marketplace manifests for Claude Code's `/plugin` install path |
| `scripts/test.js` | Smoke test (`npm test`): installer, template integrity, a full render of the fixture, the verifier |
| `.github/workflows/` | `ci.yml` (tests on PR + merge) and `release.yml` (publish on tag) |

## Releasing

Publishing runs from CI via npm [trusted publishing](https://docs.npmjs.com/trusted-publishers/)
— no npm token is stored in the repo or in GitHub secrets. To cut a release, bump the version
in both `package.json` and `.claude-plugin/plugin.json` (the smoke test fails if they disagree),
then:

```bash
npm version patch && git push --follow-tags
```

The tag triggers `release.yml`, which checks the tag matches `package.json`, runs the tests, and
publishes with provenance.

**One-time setup on npmjs.com** (after the first manual publish): package → Settings → Trusted
Publisher → GitHub Actions, with organization/user `sams-git-195`, repository
`agent-team-generator`, workflow filename `release.yml`, no environment. Fields are
case-sensitive.

## License

MIT
