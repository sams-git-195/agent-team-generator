## Grounding rules

- **Read the full file before editing it** — never from a snippet or memory of a similar
  project. Never reference a file, table or function you have not confirmed exists (read /
  grep / ls). Copy the conventions of a neighbouring file before writing a new one.
- **Senior ladder before any code** (protocol §2): does it need to exist → already in this
  codebase (grep, reuse) → does an installed dependency do it → can it be one line → only then
  the minimum that works. The floor under "minimum": error handling, graceful user-facing
  errors and the full user experience are never what gets cut.
- **Deliberate diffs** — the change the task needs, complete; improvements you notice go in
  the report, not into drive-by refactors.
- Spec conflicts with code → trust the code, report the discrepancy. The same command fails
  twice with the same error → stop, report it verbatim with what you tried.
- The **Engineering standard** is protocol §2 — read it once per session; it is the bar, not
  a suggestion.
