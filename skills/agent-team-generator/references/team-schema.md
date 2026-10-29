# `team.json` — the one file you write

`node <skill-dir>/scripts/render-team.js .agents/team.json` renders every generated file from
this. Every field is **required** unless marked *opt*; an array of strings is joined with
newlines (use it for multi-line prose); `null` or `""` on an *opt* object or string omits the
lines that depend on it. The renderer stops on a missing field and names it. For a stack that
lacks the thing a field describes, write the nearest truth ("none — static site, no server
units"), never a guess. `fixtures/team.json` is a complete worked example — copy its shape,
never its facts. Markdown is fine everywhere; backtick real paths and commands.

| Field | Meaning (where it lands) |
|---|---|
| `harness` | `both` · `claude` · `opencode` · `other` |
| `other_harness` | *opt* `{ name, pointer_file? }` — `other` only. Known names get a pointer file (Gemini CLI → `GEMINI.md`, Cursor → `.cursor/rules/agent-protocol.mdc`, Copilot → `.github/copilot-instructions.md`); or give `pointer_file` |
| `main_branch` | *opt* default `main` (code-reviewer's default diff range) |
| `mcp_servers` | *opt* server names the project configures → `mcp__<name>` allow entries in `.claude/settings.json` |
| `security_review` | `true` fills protocol §5, the qa-tester checklist and (OpenCode) `.opencode/commands/security-review.md` |
| `report_style` | `Technical` · `Direct with technical summary` · `Plain English` (protocol §7 depth; AGENTS.md) |
| `project.name` · `pitch` · `stack` | name; one-line pitch (what, for whom); the stack parenthetical ("React 18 + Vite; FastAPI + Postgres") |
| `project.personas` | array, `**Name** (role, one-line goal)` each |
| `project.targets` | *opt* success targets line |
| `project.pages` | array of `{ route, name, one_liner }` — seeds `documentation/pages/` and the README index; `[]` seeds only the README |
| `project.roles` | the roles users can have, incl. logged-out ("translator, agency, admin — plus logged-out visitors") |
| `project.core_flows` | two or three jobs that must be quickest (Usability bar step budget) or `⚠️ undecided — name the core flows` |
| `project.has_ui` · `takes_payments` | booleans — gate the UI section, the Design/Usability bars in qa-tester, the trust-before-payment rule |
| `commands.list` | array of `{ cmd, note }` → AGENTS.md §Dev commands (dev, build, lint/typecheck/test, the directory each runs from) |
| `commands.gates` | array of commands, **the full gate list, tests included** — quoted verbatim in every file; must exist in the manifest (or carry the greenfield marker) |
| `commands.gates_note` | which must pass before any task is done; what is conditional on what |
| `commands.build` · `test_narrow` | the build command (qa-tester runs it first); the single-file / single-test form (mutation checks) |
| `stack.hygiene_rule` · `hygiene_check` | the hygiene row(s) from `engineering-standard.md`: the rule as a sentence; the self-check phrase ("zero `any`; no `console.log`") |
| `stack.env_convention` · `debug_print` · `unsafe_render_apis` | same table: env layout + client prefix rule; the debug-print call(s); the raw-HTML / eval / shell APIs |
| `stack.secret_files` · `client_env_prefix` · `secret_locations` | the local secret file(s) (readable, editable, never exposed); *opt* client-shipped prefix (`VITE_`); where secrets live locally and in production |
| `stack.breakpoints` · `boundaries` | widths or device classes to verify UI at; where input is validated ("request models, forms, env, webhook payload") |
| `stack.discipline_rule` · `discipline_line` · `stack_checks` · `stack_violation` | the framework-version rule as a sentence (UI role, architect); its one-line checklist form (protocol, reviewer); qa-tester's stack checks; a 🔴 example of a banned API |
| `stack.styling_rule` · `client_rule` · `server_unit_names` | styling convention (UI role); the one-client / one-session rule (backend); what server units are called ("API routes in `src/server/`") |
| `stack.access_control_unit` · `access_control_rule` · `access_control_check` | the unit that carries per-role access ("table and router"); the architect's rule sentence; the architect's self-check phrase |
| `stack.schema_units` · `schema_locations` · `impl_order` · `ui_impl_order` · `flow_shape` · `data_change_shape` | what a spec names (tables, functions, types); where data shapes live; backend and UI implementation order; the end-to-end flow; what the architect's Data Changes section lists |
| `stack.error_shape` · `data_principles` · `stack_edge_cases` · `early_items_step` | how a server error reaches the UI; the architect's data principles line; stack-specific edge cases (timezones, webhook replay, offline); the UI role's "add i18n keys and types first" step |
| `stack.data_layer_summary` · `ui_territory_summary` | one phrase each: what the backend lane is; what the UI lane is (descriptions, intros) |
| `stack.migration` | *opt* `{ rule, state_step }` — the migration discipline and the "check migration state" workflow step; `null` without migrations |
| `stack.money` | *opt* `{ rule, module }` — integer minor units, the one module, test after touching; `null` without money |
| `stack.security_examples` | 🔴 examples for qa-tester and reviewer ("a service that skips the role check, a secret in a log") |
| `i18n` | *opt* `{ locale_files, interpolation }` — the renderer derives the i18n rule and check; `null` without i18n |
| `risk.surfaces` | the plain list, always the same string ("money math, auth and permissions, migrations, Stripe") — appears in brackets after "risk surface" everywhere |
| `risk.paths` · `critical` · `escalation` · `check` | the files that get the slow pass; the 🔴 example ("a fee miscalculation"); the step-up trigger phrase for the model matrix; the protocol checklist line |
| `risk.rule` · `impact_section` · `section` | *opt* architect's risk rule sentence; product-specialist's impact section title ("Financial Impact"); architect's output section title ("Money & Testing") |
| `risk.qa_sections` | array of bold-led checklist blocks, one per risk surface, for qa-tester |
| `gated.deploy_commands` · `live_tools` | the union of the stack's deploy channels and the never-do list, as prose with backticks (environment-targeted and property-based dangers described in words); *opt* live or paid tools ("the `stripe` CLI in live mode") |
| `design.direction` · `token_source` · `palette` · `fonts` · `conventions` · `skills` | `""` direction renders the `⚠️ undecided` marker and the propose-first rule; token file; palette; type pairing; class-merge helper, icons, toast lib; array of design skills chosen (adds "load it before UI work") |
| `agents_md.gotchas` · `architecture` · `business_rules` | arrays of markdown lines — the three sections written by hand: bold the trap then why; concrete paths for every claim; tables for anything with a number, `⚠️ undecided — ask before implementing` for unknowns |
| `agents_md.data_section_name` · `data_rules` | *opt* the data-layer section ("DB & Firestore") and its lines; omit without a backend |
| `protocol.sequencing_order` · `shared_early_items` · `shared_root_files` · `business_rule_examples` · `per_task_gates` | task sequencing; what comes first (i18n keys, types); the main agent's root files (manifests, lockfiles, CI, tooling config); two or three rules nobody may guess; per-task gates beyond the commands ("all four states handled") |
| `roster` | role names in order; core: product-specialist, architect, backend-developer, ui-ux-developer (or fullstack-developer instead of both), qa-tester, code-reviewer. Never project-manager |
| `roles.<name>.oc_model` | `provider/model-id#variant` — required when OpenCode is a target |
| `roles.<name>.cc_model` · `escalate` | *opt* overrides of the template defaults (sonnet builders + product-specialist, opus judges; step-up phrase) |
| `roles.<name>.focus` · `hands_off_to` | the roster-table cell (globs or responsibility); *opt* next role (template default) |
| `roles.<name>.owned_paths` · `forbidden_paths` · `expensive_mistake` | builders: the lane globs; the neighbouring lane; a ❌/✅ code contrast in the stack's real syntax (array of lines, fenced) |
| `roles.architect.project_skill_rule` · `project_skill_step` | *opt* "read `<skill file>` before any schema design" rule and workflow step |
| `roles.<custom>.body_file` · `template` · `kind` · `work_type` · `description` · `color` | a custom role: path to its body (`agent-skeleton.md`; `{{tags}}` from this file are allowed in it), or `template` to reuse a core template under another name (`developer` → `ui-ux-developer`); `kind` builder/reporter; the §3 work-type cell; the frontmatter description; a hex colour |

**Derived by the renderer** (never written): `gate_commands`, `personas_line`, `agent_dir`,
`agent_dirs`, `permission_files`, `what_changed_depth`, `evidence_depth`, `risk.question`,
`i18n.rule`, `i18n.check`, `builders`, `builder_names`, `builder_1`, `builder_2`,
`design.direction_or_marker`, `roster_rows`, `persona_rows`, `model_rows`, `test_globs`,
`today`, `has_cc`, `has_oc`, `has_neutral`, `has_both`, `is_ui`, `role`.
