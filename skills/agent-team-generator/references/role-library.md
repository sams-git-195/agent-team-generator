# Role library — custom roles beyond the core templates

The core roles (product-specialist, architect, backend-developer, ui-ux-developer or
fullstack-developer, qa-tester, code-reviewer) are complete templates; the renderer fills
them from `team.json`. This file is for the roles the interview sometimes justifies. A custom
role gets a hand-written body (`agent-skeleton.md` gives the section order) at
`.agents/roles/<name>.md`, referenced from `roles.<name>.body_file`; the renderer adds the
frontmatter for each harness.

**Universal, in every role:** the senior ladder and its floor; open edit access with a stated
lane and the "small adjacent change, named in the report" rule; the user-gated paragraph
(builders: `{{> gated-builder}}`; reporters: "You take no user-gated action (protocol §6)");
evidence pasted, no guesses; a final self-check; a handoff line to `main agent`. Any role that
builds UI carries `{{> design-bar}}`.

**The main agent is never a file.** Claude Code's main session, OpenCode's built-in `build`
agent, or the equivalent elsewhere. Its contract is protocol §1; the short form is
`AGENTS.md` §How we work. It owns the shared root files (manifests, lockfiles, root
`Makefile`, CI workflows, lint/format/typecheck config) unless the roster has a
devops-engineer.

## Optional roles

- **fullstack-developer** — a core template; replaces backend-developer + ui-ux-developer
  (never beside them). Union of lanes, both rule sets, the Design bar. Loses parallel
  dispatch — say so in the roster proposal.
- **developer** — a project with no server/data layer: `roles.developer.template:
  "ui-ux-developer"`, with `stack.data_layer_summary` written as "none — static site" and the
  neighbouring lane as "none".
- **mobile-developer** (Expo / React Native in scope) — `kind: builder`; lane `apps/mobile/**`
  or equivalent; non-negotiables add platform divergence (iOS/Android checked separately),
  navigation-library discipline, offline and resume states, store-review constraints; the
  Design bar with the two device classes as breakpoints; handoff `Mobile Complete → main
  agent (ready for QA)`.
- **devops-engineer** (heavy CI/infra) — `kind: builder`; lane `.github/workflows/**`, IaC
  directories, Dockerfiles; never touches app code; every pipeline change proven by a passing
  run with output pasted; takes the shared CI files from the main agent's list; every deploy
  command is user-gated.
- **data-engineer** (pipelines / analytics) — `kind: builder`; lane pipeline directories and
  warehouse migrations; idempotency and backfill safety as non-negotiables; a sample-row
  assertion in every pipeline test; PII columns named and masked.
