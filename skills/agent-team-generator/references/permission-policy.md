# Permission policy — open by default, user-gated by instruction

The team's permission policy is chosen ONCE in interview Phase 5.3 and applies to every agent
and to the main session. It is written mechanically into two files, never into agent files:

- `opencode.json` at the repo root (OpenCode 2 — the top-level `permissions` rule list; every
  agent inherits it, agent files carry no permission rules of their own), and
- `.claude/settings.json` (`permissions.allow` / `ask` / `deny`) for Claude Code.

**Two layers, kept separate on purpose:**

1. **Permission (mechanical)** — what the harness will let an agent do. Default: everything.
2. **Instruction (behavioural)** — what an agent actually does. Protocol §6 "Autonomy &
   user-gated actions": an agent commits freely but pushes, opens PRs, deploys, migrates a
   shared database, or destroys anything only when the user has said so in the conversation.

A permission is not an instruction. The open default exists so that when the user *does* say
"push it" or "deploy", the agent carries it through without a prompt in the way. Stricter
tiers add a mechanical net under the same behavioural rule; they never replace it.

**Edit access is open in every tier.** Every agent — builders, reviewers, designers — may
edit any file in the repo. Ownership (the roster table in `AGENTS.md`) is a *focus*, held by
each agent's "Scope & focus" section, not a mechanical deny: an agent stays in its lane, and
steps outside it only when the task in front of it needs a small adjacent change, which it
then names in its report.

## The tiers

Present the table, recommend **Autonomous**, and let the user pick.

| Tier | Allow | Ask | Deny | Recommend when |
|---|---|---|---|---|
| **Autonomous** ("allow all" — recommended) | everything: shell, edits, web, subagents | nothing | nothing | the default. The user gives an instruction and the team carries it through; user-gated actions are held by protocol §6 |
| **Open** ("deny destructive only") | everything else | nothing | destructive set + deploy set | the user wants zero prompts but a hard stop on the irreversible — and accepts running deploys by hand |
| **Guarded** ("ask outside the repo") | anything whose effect stays in the working tree | push, PR creation, global installs, `curl`/`wget`, paths outside the repo | destructive set + deploy set | speed, with a prompt on every external side effect |
| **Standard** | everything else | push, PR creation, `rm`, package installs, `curl`/`wget`, `sh`/`bash` | destructive set + deploy set | shared machines; teams new to agents |
| **Strict** | gate commands, read-only git + add/commit, read-only shell | everything else | destructive set + deploy set + installs + network + `sh`/`bash` + `git rebase`/`git restore` | the machine holds production credentials; client repos |
| **Custom** | start from Standard and walk the ask and deny sets category by category | | | |

Say this when presenting: in **Autonomous** nothing is blocked mechanically — the safety is
the §6 rule plus the user's own harness mode. In every other tier a `deny` means the *user*
runs that command themselves, even after telling an agent to; that is the trade.

## Pattern sets (written once, emitted in both syntaxes)

OpenCode 2 and Claude Code share the same pattern shape: a prefix with `*` wildcards, where a
trailing ` *` also matches the bare command. Each pattern `P` below is emitted as

- OpenCode: `{ "action": "shell", "resource": "P", "effect": "ask" | "deny" }`
- Claude Code: `"Bash(P)"` in the `ask` or `deny` array.

A rule with two wildcards ends in `*` with no space before it (`git push * --force*`): the
bare-command match of a trailing ` *` only holds when it is the rule's sole wildcard.

**Destructive set** (deny in Open / Guarded / Standard / Strict)

```text
git push --force *      git push -f *           git push * --force*     git push * -f*
git reset --hard *      git clean -f *          git checkout -- *       git branch -D *
git stash drop *        git stash clear *       git config --global *
sudo *                  chmod *                 chown *                 dd *
mkfs *                  npm publish *
```

**Deploy set** (deny in the same tiers) — the UNION of the stack's deploy channels (interview
Phase 2.6) and the Phase 5.2 never-do list, e.g. `supabase db push *` · `firebase deploy *` ·
`vercel --prod *` · `prisma migrate deploy *` · `terraform apply *` · `fly deploy *`. If the two
lists disagree, the union wins.

**Outward set** (ask in Guarded and Standard; in Strict covered by the `ask` default)

```text
git push *              gh pr create *          gh pr merge *           curl *          wget *
```

**Package-install set** (ask in Standard; global forms only in Guarded; deny in Strict).
Include the rows for package managers present in this stack.

```text
npm install *    npm i *          npm ci *         pnpm add *       pnpm install *
yarn *           bun add *        bun install *    pip install *    pip3 install *
uv add *         uv sync *        uv pip install * poetry add *     poetry install *
cargo add *      cargo install *  go get *         go install *
```
Guarded's global forms: `npm install -g *` · `npm i -g *` · `pnpm add -g *` · `yarn global *` ·
`bun add -g *` · `pip install *` · `pip3 install *` · `cargo install *` · `go install *`.

**Local-destructive set** (ask in Standard; deny in Strict): `rm *` · `git restore *` ·
`sh *` · `bash *`. Strict adds `git rebase *` to deny.

**Strict allow set**: one pattern per gate command verbatim, plus `git status *` · `git log *`
· `git diff *` · `git show *` · `git branch` · `git add *` · `git commit *` · `ls *` · `cat *`
· `head *` · `tail *` · `grep *` · `rg *` · `find *` · `wc *` · `pwd` · `which *`.

**Stack-specific additions** (recommend after the tier is chosen, only ones that exist in this
stack; skipped in Autonomous, where they join the §6 user-gated list as prose instead):
migration deploys (`drizzle-kit push`) · infra (`pulumi up`) · publishing (`cargo publish`,
`twine upload`) · container destruction (`docker system prune`, `docker volume rm`) ·
Windows-native deletes (`Remove-Item`, `del`) when the team runs PowerShell.

**Property-based and environment-targeted dangers.** Two kinds of never-do item cannot be a
prefix: (a) a CLI whose danger is a flag or a logged-in account (`stripe` in live mode) —
emit a wholesale `tool *` ask plus deny patterns for the obvious shapes (`stripe --live*`,
`stripe * --live*`); (b) a command whose target is an env var (`alembic upgrade head`,
`prisma migrate deploy` — production only when `DATABASE_URL` says so) — emit `ask`, not
`deny`, when the same command has a routine local form. `deny` is right only when production
is the command's default target (`fly deploy`, `vercel --prod`). In every tier, including
Autonomous, each of these is named in protocol §6 as user-gated.

## OpenCode 2 — `opencode.json`

OpenCode 2 replaced the v1 `permission` map with a `permissions` **rule list**; each rule is
`{ action, resource, effect }`. **The last matching rule wins**, so emit in this order: the
`*` default, then `allow` exceptions (Strict only), then `ask` rules, then `deny` rules.
Agent-level rules are *appended* to this list, so agent files carry none — one policy, one
place. Write plain JSON (no comments) so the verifier can parse it.

**Autonomous**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permissions": [
    { "action": "*", "resource": "*", "effect": "allow" }
  ]
}
```
The explicit rule sits after OpenCode's built-in defaults, so it also lifts the default
`external_directory` and `.env`-read prompts. Say so; if the user wants those two prompts
back, append `{ "action": "external_directory", "resource": "*", "effect": "ask" }` and
`{ "action": "read", "resource": "*.env", "effect": "ask" }`.

**Open / Guarded / Standard** — the same file, with rules appended in order:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permissions": [
    { "action": "*", "resource": "*", "effect": "allow" },
    { "action": "shell", "resource": "git push *", "effect": "ask" },
    { "action": "shell", "resource": "git push --force *", "effect": "deny" },
    { "action": "shell", "resource": "fly deploy *", "effect": "deny" }
  ]
}
```
(shape only — emit every pattern of the tier's ask sets, then every pattern of its deny
sets). Guarded also appends `{ "action": "external_directory", "resource": "*", "effect": "ask" }`
before the denies.

**Strict** — first rule `{ "action": "shell", "resource": "*", "effect": "ask" }` (preceded by
`{ "action": "*", "resource": "*", "effect": "allow" }` so edits and reads stay open), then
the Strict allow set as `allow`, then every deny set, then the `external_directory` ask.

**Action names (v2):** `shell` (was `bash`) · `subagent` (was `task`) · `edit` · `read` ·
`glob` · `grep` · `skill` · `webfetch` · `websearch` · `question` · `external_directory`.

**Still on OpenCode 1?** The generator targets v2. For a v1 install, tell the user the
mapping and let them decide: directory `.opencode/agent/` (v2: `agents/`) · `permission:` map
with `bash:`/`task:` keys (v2: `permissions:` list with `shell`/`subagent`) · `model:` plus a
separate `variant`/`reasoningEffort` (v2: `provider/model#variant`) · top-level `temperature`
(v2: `request.body.temperature`). Mark the hand-over `⚠️ verify against the installed
OpenCode version` either way.

## Claude Code — `.claude/settings.json`

Claude Code evaluates **deny, then ask, then allow**; order inside an array is irrelevant. A
bare tool name matches every use of that tool. Write to `.claude/settings.json` (shared,
committed); tell the user `settings.local.json` is where personal changes go.

**Autonomous**
```json
{
  "permissions": {
    "allow": ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"]
  }
}
```
Add one `"mcp__<server>"` entry per MCP server the project configures (allow rules need a
literal server name — `"mcp__*"` is skipped with a warning). Two things this file cannot do,
and the hand-over says so: writes to protected paths (`.git`, `.claude`) still prompt, and
the session's permission *mode* (auto, bypass) is the user's own choice at launch — the skill
never writes `defaultMode`. Subagents inherit the session's permissions; agent files omit
`tools:` so each agent inherits every tool, MCP included.

**Other tiers** — `"allow"` as above; the tier's ask sets in `"ask"` and deny sets in `"deny"`,
each pattern as `"Bash(P)"`. Strict replaces `"Bash"` in `allow` with the Strict allow set.
**Never put `Bash(npx *)` in `allow`** in Strict — Claude Code does not strip `npx` as a
wrapper, so it would approve anything after it; allow exact npx gate commands instead.

**Standard, as generated:**
```json
{
  "permissions": {
    "allow": ["Bash", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"],
    "ask": [
      "Bash(git push *)", "Bash(gh pr create *)", "Bash(gh pr merge *)", "Bash(rm *)",
      "Bash(git restore *)", "Bash(sh *)", "Bash(bash *)", "Bash(curl *)", "Bash(wget *)",
      "Bash(npm install *)", "Bash(npm i *)", "Bash(npm ci *)"
    ],
    "deny": [
      "Bash(git push --force *)", "Bash(git push -f *)", "Bash(git push * --force*)",
      "Bash(git push * -f*)", "Bash(git reset --hard *)", "Bash(git clean -f *)",
      "Bash(git checkout -- *)", "Bash(git branch -D *)", "Bash(git stash drop *)",
      "Bash(git stash clear *)", "Bash(git config --global *)", "Bash(sudo *)",
      "Bash(chmod *)", "Bash(chown *)", "Bash(dd *)", "Bash(mkfs *)", "Bash(npm publish *)"
    ]
  }
}
```
Append the deploy set and the stack-specific additions in the same syntax.

## Verification (SKILL.md Step 6)

- `opencode.json` parses, its `permissions` is a list of `{action, resource, effect}` rules,
  the first rule is the `*`/`*` allow, and no `deny` rule precedes an `ask` rule.
- No agent file carries a v1 `permission:` map, a `tools:` map, or its own `permissions:` list.
- Every shell `deny` in `opencode.json` appears in `.claude/settings.json`'s `deny`, and the
  deploy set is in both — unless the tier is Autonomous, where the hand-over says "no
  mechanical guard; user-gated actions are held by protocol §6".
- No `{…}` tokens from this reference remain.
