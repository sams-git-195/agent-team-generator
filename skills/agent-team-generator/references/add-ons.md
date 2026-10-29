# Optional add-ons (all repos, SKILL.md Step 5)

For each add-on the user chose, ask **project level** (this repo) or **user level** (all their
projects), run the matching install only after they choose, verify the directory exists and
report the path. A failed install is reported verbatim and skipped — never block generation.
`npm install -g` is machine-wide either way (it is the CLI, not the skill) — say so.

| Add-on | What it does | Project-level install | User-level install |
|---|---|---|---|
| **frontend-design** (Anthropic — recommended for any project with a UI) | A design process before any UI code: purpose, audience, type and colour direction, composition, motion | — (plugin installs are per user) | Claude Code: `/plugin marketplace add anthropics/claude-code` then `/plugin install frontend-design@claude-code-plugins` |
| **Impeccable** ([repo](https://github.com/pbakaus/impeccable)) | Reference files for typography, colour, spatial design, motion, interaction, responsive, UX writing, plus audit/polish commands | follow the repo's instructions for the harness in use — verify before running | same |
| **UI/UX Pro Max** ([repo](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)) | Design systems, UI styles, palettes, stack-specific code | `npm install -g ui-ux-pro-max-cli` then `uipro init --ai claude` (project root) | `npm install -g ui-ux-pro-max-cli` then `uipro init --ai claude --global` |
| **Animation Principles** ([repo](https://github.com/dylantarre/animation-principles)) | Motion guidance by skill level | `npx skillfish add dylantarre/animation-principles 04-by-skill-level --project` | `… --global` |
| **Web-app testing** (Anthropic, [repo](https://github.com/anthropics/skills)) | Playwright-driven browser testing — feeds qa-tester's "verify by running" and the UI role's screenshot check | `npx skillfish add anthropics/skills webapp-testing --project` | `… --global`, or `/plugin marketplace add anthropics/skills` in Claude Code |
| **Superpowers** ([repo](https://github.com/obra/superpowers)) | Full methodology: TDD, debugging, planning, brainstorming. Overlaps the team's protocol — say so; the protocol wins where they conflict (note in AGENTS.md gotchas if installed) | — | Claude Code: `/plugin install superpowers@claude-plugins-official`; OpenCode per the repo |

A design skill chosen in the gates is already in `team.json` (`design.skills`), so the
rendered UI role and AGENTS.md §UI say "load it before UI work"; this step only installs it.
Design add-ons only matter on projects with a UI. After the menu, ask once: "any other skills
or plugins you already use that I should install?" — install at the chosen level with the
same tools, never guessing at a source. Record what was installed, and where, in the
hand-over. This table is meant to grow.

**Security review** is generated, not installed: `security_review: true` in `team.json` fills
protocol §5 and the qa-tester checklist, and with OpenCode renders
`.opencode/commands/security-review.md` (runs under qa-tester, report-only).
