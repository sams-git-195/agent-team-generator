---
description: Security review of the current diff for {{project.name}} — report only, no edits
agent: qa-tester
---
Review the current diff (`git diff` plus uncommitted changes) of **{{project.name}}** for
security issues, and report — do not edit any file.

Context: risk surfaces are {{risk.surfaces}}. Roles: {{project.roles}}. Secrets live only in
{{stack.secret_locations}}{{#stack.client_env_prefix}}; nothing secret in `{{stack.client_env_prefix}}` vars{{/stack.client_env_prefix}}.
Unsafe rendering APIs here: {{stack.unsafe_render_apis}}.

Check, in this order: injection (SQL, command, template, path) · authn and authz gaps on every
new or changed server unit, per role · secret exposure in code, client bundles, logs or
reports · unsafe rendering of external content · {{risk.surfaces}}-specific issues (wrong
result, bypass, replay, race). For each finding give `file:line`, one of the five lights from
protocol §5 (🔴 🟠 🟡 🔵 🟣), graded by its bug test: a failure scenario and the evidence
level (reproduced or traced) for every 🔴 and 🟠, and the smallest fix in one sentence.
Suspicions you could not trace go under "Unverified concerns". End with
`Security review: PASS | FAIL`.
