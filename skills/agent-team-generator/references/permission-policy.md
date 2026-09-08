# Permission policy — one policy, five tiers, every harness

The team's bash-permission policy is chosen ONCE in interview Phase 5.3 and applied
identically to every agent. It is written mechanically into:

- every `.opencode/agent/<role>.md` frontmatter, replacing `{PERMISSION_POLICY_BLOCK}`, and
- `.claude/settings.json` (`permissions.allow` / `ask` / `deny`) for Claude Code.

Per-role variation of the bash policy is not offered — one team, one policy. Per-role *edit*
scope is separate (the ownership map) and stays in each OC file's `edit:` allow-list; Claude
Code cannot enforce per-agent edit scope from settings (settings are session-wide), so in CC
the ownership contract stays prose in the agent body.

## The tiers

Present the table, recommend **Standard**, and let the user pick. Every tier except Sandbox
keeps the **destructive set** and the **deploy set** as `deny` — those are the fixed part of
the git/deploy policy (protocol §6). Sandbox is the one tier with no safety net and the
interview must say so in those words.

| Tier | Allow | Ask | Deny | Recommend when |
|---|---|---|---|---|
| **Sandbox** ("allow all") | everything | nothing | nothing | disposable container/VM, no real credentials on the machine; the git/deploy policy is prose-only here |
| **Open** ("deny destructive only") | everything else, incl. `git push` mechanically (protocol §6 still says ask first) | nothing | destructive set + deploy set | solo dev on throwaway branches who wants zero prompts |
| **Guarded** ("ask outside the repo") | anything whose effect stays inside the working tree, incl. `rm` and local installs | anything reaching outside it: `git push`, PR creation, global installs, `curl`/`wget`, paths outside the repo | destructive set + deploy set | solo dev who wants speed with no external side effects |
| **Standard** (recommended) | everything else | `git push`, PR creation, `rm`, every package install, `curl`/`wget`, `sh -c`/`bash -c` | destructive set + deploy set | most projects |
| **Strict** | the project's gate commands, read-only git + commit/add, ls/cat/grep/find | everything else | destructive set + deploy set + installs + `curl`/`wget` + `sh -c`/`bash -c` + `git rebase`/`git restore`/`git checkout --` | machine holds production credentials, shared runners, client repos |
| **Custom** | walk the ask and deny lists category by category, starting from Standard | | | |

**Rationale to present:** irreversible or environment-changing → deny; recoverable-destructive
or outward-facing → ask; everything else → allow. Stricter tiers move outward-facing commands
from ask to deny and shrink allow to a closed list.

### Destructive set (deny in every tier except Sandbox)

```yaml
    "git push --force*": deny
    "git push -f*": deny
    "git push* --force*": deny        # flag-after-remote forms: git push origin main --force
    "git push* -f*": deny
    "git reset --hard*": deny
    "git clean -f*": deny
    "git checkout -- *": deny         # discards working changes
    "git branch -D*": deny
    "git stash drop*": deny
    "git stash clear*": deny
    "git config --global*": deny
    "sudo *": deny
    "chmod *": deny
    "chown *": deny
    "dd *": deny
    "mkfs*": deny
    "* | sh": deny                    # pipe-to-shell (see caveat below)
    "* | bash": deny
    "* | zsh": deny
    "npm publish*": deny
    {DEPLOY_DENY_LINES}
```

`{DEPLOY_DENY_LINES}` = one `deny` per command in the **deploy set**: the UNION of the stack's
deploy channels (interview Phase 2.6) and the Phase 5.2 never-do list — e.g.
`"supabase db push*": deny` · `"firebase deploy*": deny` · `"vercel --prod*": deny` ·
`"prisma migrate deploy*": deny` · `"terraform apply*": deny`. If the two lists disagree, the
union wins.

### Package-install set (ask in Standard/Guarded-global, deny in Strict)

Include the rows for package managers present in this stack (from the stack hygiene table in
`engineering-standard.md`); including extra rows is harmless.

```yaml
    "npm install*": ask
    "npm i": ask
    "npm i *": ask
    "npm ci*": ask
    "pnpm add*": ask
    "pnpm install*": ask
    "yarn": ask
    "yarn add*": ask
    "yarn install*": ask
    "bun add*": ask
    "bun install*": ask
    "pip install*": ask
    "pip3 install*": ask
    "uv add*": ask
    "uv sync*": ask
    "uv pip install*": ask
    "poetry add*": ask
    "poetry install*": ask
    "cargo add*": ask
    "cargo install*": ask
    "go get*": ask
    "go install*": ask
```

### Stack-specific additions (recommend after the tier is chosen)

Only ones that exist in this stack: migration deploys (`prisma migrate deploy`,
`drizzle-kit push`) · infra (`terraform apply`, `pulumi up`) · publishing (`npm publish`,
`cargo publish`, `twine upload`) · container destruction (`docker system prune`, `docker volume
rm`) · CLIs with live/production modes (Stripe, Shopify… — prefer a wholesale `"tool *": ask`,
see "property-based dangers" in `agent-skeleton.md`) · Windows-native deletes (`Remove-Item`,
`del`) when the team runs PowerShell. Accepted additions become `{POLICY_ADJUSTMENT_ASK_LINES}`
(ask-type) and `{POLICY_ADJUSTMENT_DENY_LINES}` (deny-type) — each goes in its own band.
Phase 5.2 never-do items resolved to `ask` under the property-based rule below are emitted
in the ask band too.

**Property-based and environment-targeted dangers.** Two kinds of never-do item cannot be a
prefix: (a) a CLI whose danger is a flag or logged-in account (`stripe` in live mode) — emit a
wholesale `"tool *": ask` plus deny lines for the obvious shapes (`"stripe --live*"`,
`"stripe * --live*"`); (b) a command whose target is an env var (`alembic upgrade head`,
`prisma migrate deploy` — production only when `DATABASE_URL` says so) — emit `ask`, not
`deny`, when the same command has a routine local form, and say so in protocol §6. `deny` is
right only when production is the command's default target (`fly deploy`, `vercel --prod`).

## OpenCode blocks (paste into `{PERMISSION_POLICY_BLOCK}`)

OpenCode evaluates bash rules by pattern match and **the last matching rule wins**, so emit
lines in this order: the `"*"` default, then `allow` exceptions (Strict only), then `ask`
lines, then `deny` lines. Never reorder. The block sits at the `permission:` key's child
indentation (two spaces) and starts with `bash:`.

**Sandbox**
```yaml
  bash:
    "*": allow
```

**Open**
```yaml
  bash:
    "*": allow
    {DESTRUCTIVE_SET}
```

**Guarded**
```yaml
  bash:
    "*": allow
    "git push*": ask
    "gh pr create*": ask
    "npm install -g*": ask
    "npm i -g*": ask
    "pnpm add -g*": ask
    "yarn global*": ask
    "bun add -g*": ask
    "pip install*": ask
    "pip3 install*": ask
    "cargo install*": ask
    "go install*": ask
    "curl *": ask
    "wget *": ask
    {POLICY_ADJUSTMENT_ASK_LINES}
    {DESTRUCTIVE_SET}
    {POLICY_ADJUSTMENT_DENY_LINES}
  external_directory: ask
```

**Standard**
```yaml
  bash:
    "*": allow
    "git push*": ask
    "gh pr create*": ask
    "rm *": ask
    "git restore *": ask
    "sh -c *": ask
    "bash -c *": ask
    {PACKAGE_INSTALL_SET}
    "curl *": ask
    "wget *": ask
    {POLICY_ADJUSTMENT_ASK_LINES}
    {DESTRUCTIVE_SET}
    {POLICY_ADJUSTMENT_DENY_LINES}
```

**Strict**
```yaml
  bash:
    "*": ask
    {GATE_COMMAND_ALLOW_LINES — one allow per gate command verbatim, e.g. "npm run lint": allow}
    "git status*": allow
    "git log*": allow
    "git diff*": allow
    "git show*": allow
    "git branch": allow
    "git add*": allow
    "git commit*": allow
    "ls*": allow
    "cat *": allow
    "head *": allow
    "tail *": allow
    "grep *": allow
    "rg *": allow
    "find *": allow
    "wc *": allow
    "pwd": allow
    "which *": allow
    "git rebase*": deny
    "git restore *": deny
    "sh -c *": deny
    "bash -c *": deny
    "curl *": deny
    "wget *": deny
    {PACKAGE_INSTALL_SET with ask → deny}
    {DESTRUCTIVE_SET}
    {POLICY_ADJUSTMENT_DENY_LINES — Strict has no ask band; adjustments that were "ask" become deny}
  external_directory: ask
```

Resolve `{DESTRUCTIVE_SET}`, `{PACKAGE_INSTALL_SET}`, `{DEPLOY_DENY_LINES}`,
`{POLICY_ADJUSTMENT_ASK_LINES}`, `{POLICY_ADJUSTMENT_DENY_LINES}` and
`{GATE_COMMAND_ALLOW_LINES}` before writing — the generated file contains no braces from this
reference. Delete an adjustment placeholder if it has no lines. **Strip the `# comments`** from
the destructive set when emitting: the block must be bare `"pattern": action` lines so the
verifier's ordering and parity checks see every line.

**Caveats to state in the hand-over:**
- `color:` in OC agent frontmatter is not in the documented markdown-agent field list — verify
  against the installed OpenCode version; harmless if ignored.
- OpenCode matches "parsed commands"; if it splits pipelines, the `"* | sh"` lines never match.
  The `sh -c`/`bash -c` asks (Standard) and denies (Strict) are the fallback. Verify once with
  a harmless `echo hi | sh`.

## Claude Code `.claude/settings.json` (same policy, CC syntax)

Claude Code evaluates **deny, then ask, then allow — first match in that order wins**, so order
inside each array is irrelevant. Bash rules use `Bash(prefix *)`; a trailing ` *` also matches
the bare command. `ask` and `deny` rules apply immediately; `allow` rules apply after each
teammate trusts the folder. Write the file to `.claude/settings.json` (shared, committed);
tell the user `settings.local.json` is where personal loosening goes.

Translation rules OC → CC:
- `"git push*": ask` → `"Bash(git push *)"` in `ask`. Same for every prefix rule.
- A rule with **two** wildcards must end in `*` with no space before it:
  `Bash(git push * --force*)`. CC matches the bare form of a trailing ` *` only when it is the
  rule's sole wildcard, so the same rule written with a space before the last star would miss
  `git push origin main --force`. The no-space form also catches `--force-with-lease`.
- `"* | sh": deny` has no CC equivalent — CC splits on `|` and checks each subcommand; use
  `"Bash(sh *)"`/`"Bash(bash *)"` at the same level as the OC `sh -c` lines (ask in Standard,
  deny in Strict).
- `"*": allow` → `"Bash"` in `allow` (Sandbox/Open/Guarded/Standard). Strict lists gate
  commands and read-only git instead. **Never put `Bash(npx *)` in `allow`** — CC does not
  strip `npx` as a wrapper, so it would approve anything after it; allow exact npx gate
  commands if the project has them.
- `external_directory: ask` → nothing to write: CC prompts for edits outside the working
  directory by default. Bash commands that only *reference* outside paths are not fenced by CC
  except for redirects; say so.
- Deploy set and destructive set → `deny`, same prefixes.

**Standard, as generated** (other tiers follow the same translation):
```json
{
  "permissions": {
    "allow": ["Bash"],
    "ask": [
      "Bash(git push *)", "Bash(gh pr create *)", "Bash(rm *)", "Bash(git restore *)",
      "Bash(sh *)", "Bash(bash *)",
      "Bash(npm install *)", "Bash(npm i *)", "Bash(npm ci *)", "Bash(pnpm add *)",
      "Bash(pnpm install *)", "Bash(yarn *)", "Bash(bun add *)", "Bash(bun install *)",
      "Bash(pip install *)", "Bash(pip3 install *)", "Bash(uv add *)", "Bash(uv sync *)",
      "Bash(poetry add *)", "Bash(poetry install *)",
      "Bash(cargo add *)", "Bash(cargo install *)", "Bash(go get *)", "Bash(go install *)",
      "Bash(curl *)", "Bash(wget *)"
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
Append the deploy set and the adjustment lines to `deny`/`ask` in CC syntax. Trim the
install rows to the stack's package managers if the user prefers a short file.

## Verification (SKILL.md Step 6)

- Every OC file's bash block is byte-identical to every other OC file's (one policy).
- The block's first line is the tier's `"*"` default; denies come last.
- Every command in the deploy set appears as `deny` in every OC file AND in
  `.claude/settings.json`'s `deny` (unless Sandbox — then the hand-over says "no mechanical
  deploy guard").
- No `{…}` tokens from this reference remain.
