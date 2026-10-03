# agent-team-generator

A [Claude Code](https://claude.com/claude-code) skill that scaffolds a complete, disciplined
AI agent team for your project:

- an **interview** that extracts your stack, risk surfaces, and business rules — including
  which **harness** (Claude Code, OpenCode 2, both kept in line, or another), whether you want
  separate **backend + UI/UX developers** (parallel dispatch) or a single **full-stack
  developer** (simpler roster), and how the main agent should **report to you**
  (technical / direct / plain English — always outcome-first and structured); a fast path
  accepts the recommended defaults in one question
- `AGENTS.md` + `CLAUDE.md` foundation files
- specialist subagents for **both Claude Code** (`.claude/agents/`) **and OpenCode 2**
  (`.opencode/agents/`, `provider/model#variant` pins, permissions as a rule list in
  `opencode.json`), each with a stated lane and per-project non-negotiables
- a **Fable-level process protocol** (`.agents/rules/claude-agent-protocol.md`) so mid-level
  models follow frontier-model steps — the quality bar lives in the process files, not the
  model — plus a language-agnostic **engineering standard** with per-stack hygiene rules
  (TypeScript, Python, Go, Rust)
- the **senior ladder**, in every agent that writes code: does it need to exist → is it
  already in the codebase → does an installed dependency do it → can it be one line → only
  then the minimum that works — with a floor that never drops error handling, graceful
  user-facing errors, or user experience
- a **Design bar** in every agent that builds UI — a design direction before any pixels,
  tokens, designed states, whole pages, and a list of generated-looking patterns to redo —
  plus recommended design skills (`frontend-design`, [Impeccable](https://github.com/pbakaus/impeccable),
  [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill))
- an independent **code-reviewer** you run on request: it reviews the diff and the code
  around it, grades findings 🔴 Blocker / 🟠 Should fix / 🟡 Nit / 🔵 FYI / 🟣 Minor, proves
  the tests can fail by changing a value, logs minor issues to
  `documentation/known-issues.md`, and hands back a ready-to-run fix prompt
- **open permissions, user-gated actions**: by default agents may edit any file and run any
  command, so an instruction is carried through without prompts — and they commit freely but
  push, open PRs, deploy, or destroy anything only when you say so. Stricter tiers (Open,
  Guarded, Standard, Strict) add a mechanical net, written once to `opencode.json` and
  `.claude/settings.json`
- a **mechanical verifier** (`.agents/verify-team.js`) left in your repo: placeholders, roster
  vs files, OpenCode 2 shape, permission parity across harnesses, gate scripts
- a plain-English `documentation/` system maintained as part of Definition of Done
- optional third-party **skill add-ons** ([Animation Principles](https://github.com/dylantarre/animation-principles),
  [Anthropic's web-app testing](https://github.com/anthropics/skills),
  [Superpowers](https://github.com/obra/superpowers)) — offered during the interview,
  installed at project or user level, your choice — plus a security-review command for
  OpenCode parity with Claude Code's built-in `/security-review`

There is no project-manager agent. The **main agent** — the session you are talking to —
leads: it dispatches the specialists (product-specialist, architect, developers, qa-tester)
and, for small quick changes, does the work itself under that specialist's rules.

## Install

```bash
npx agent-team-generator
```

That copies the skill to `~/.claude/skills/agent-team-generator`, making it available in every
project. To install for a single repo instead:

```bash
npx agent-team-generator --project
```

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

Open Claude Code in the project you want an agent team for and run:

```
/agent-team-generator
```

…or just say "set up my agent team". The skill will survey the repo, interview you phase by
phase, propose a roster for approval, and only then generate files. Unknowns become explicit
`⚠️ undecided` markers — never guesses.

## Repo layout

| Path | What |
|---|---|
| `skills/agent-team-generator/SKILL.md` | The skill entrypoint (workflow, steps, verification) |
| `skills/agent-team-generator/references/` | Interview bank, protocol + AGENTS.md templates, role library, Fable playbook, engineering + design standards, permission policy |
| `skills/agent-team-generator/references/templates/` | Pre-filled agent files for the core roles (incl. code-reviewer) + fullstack-developer |
| `skills/agent-team-generator/scripts/verify-team.js` | Mechanical post-generation checks; copied into the target's `.agents/` |
| `skills/agent-team-generator/fixtures/` | Canned interview for testing the skill itself |
| `bin/cli.js` | The `npx` installer |
| `.claude-plugin/` | Plugin + marketplace manifests for Claude Code's `/plugin` install path |
| `scripts/test.js` | Smoke test (`npm test`): installer round-trip + template integrity |
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
