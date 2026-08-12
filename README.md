# agent-team-generator

A [Claude Code](https://claude.com/claude-code) skill that scaffolds a complete, disciplined
AI agent team for your project:

- an **interview** that extracts your stack, risk surfaces, and business rules — including
  whether you want separate **backend + UI/UX developers** (parallel dispatch) or a single
  **full-stack developer** (simpler roster)
- `AGENTS.md` + `CLAUDE.md` foundation files
- specialist subagents for **both Claude Code** (`.claude/agents/`) **and OpenCode**
  (`.opencode/agent/`), with file-ownership contracts, closed permission lists, and
  per-project non-negotiables
- a **Fable-level process protocol** (`.agents/rules/claude-agent-protocol.md`) so mid-level
  models follow frontier-model steps — the quality bar lives in the process files, not the model
- a plain-English `documentation/` system maintained as part of Definition of Done
- optional third-party **skill add-ons** ([UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
  [Animation Principles](https://github.com/dylantarre/animation-principles),
  [Anthropic's web-app testing](https://github.com/anthropics/skills),
  [Superpowers](https://github.com/obra/superpowers)) — offered during the interview,
  installed at project or user level, your choice — plus a security-review command for
  OpenCode parity with Claude Code's built-in `/security-review`
- an **agent bash-permission policy** you tune in the interview (allow-by-default; deploys
  denied; pushes, PR creation, deletes, and installs prompt first)

The project-manager runs as the **main session**, not a subagent; specialists
(product-specialist, architect, developers, qa-tester) are dispatched with tight contracts
and mandatory evidence.

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
| `skills/agent-team-generator/references/` | Interview bank, protocol + AGENTS.md templates, role library, Fable playbook |
| `skills/agent-team-generator/references/templates/` | Pre-filled agent files for the core roles + fullstack-developer |
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
