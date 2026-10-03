# Documentation convention — templates for `documentation/`

Plain-English living docs: written for humans and for future model sessions with zero context.
Whoever makes a change updates them in the same piece of work, the main agent confirms it as
part of Definition of Done (protocol §4), and qa-tester verifies.
Descriptive, not implementation dumps — a reader should understand the product without opening
the code. File paths may be named as anchors, but no code blocks longer than a signature.

Seed on generation: `known-issues.md` (template at the bottom — the code-reviewer's log),
`README.md` with the sections below (empty tables are fine on day one),
plus one page doc per route the interview named (Phase 1, question 5) — never invent pages the
user didn't name. Add a `.gitkeep` to any directory left empty so git tracks it. A page doc
seeded before its spec exists keeps every section and the header fields (Access, Purpose),
each filled with `⚠️ undecided — spec pending`; its README one-liner is written from the
interview if the user described the page, otherwise the same marker; its footer reads
`*Last updated: <today> — seeded*`; an index table with no rows yet gets one italic `*(none documented yet)*` row.

## `documentation/README.md`

```markdown
# {PROJECT_NAME} — Product Documentation

Plain-English descriptions of every page and feature. Updated by whoever makes the change,
before any feature is marked Done. Accepted minor issues: [known-issues.md](known-issues.md). If code and these docs disagree, the code is right —
fix the doc and note what drifted.

## Pages
| Page | Route | One-liner |
|---|---|---|
| [Name](pages/name.md) | `/route` | {what it's for} |

## Features
| Feature | One-liner | Pages involved |
|---|---|---|
| [Name](features/name.md) | {what it does} | {links} |
```

## `documentation/pages/<page>.md`

**Filename from the route**, so two people always pick the same name: drop the leading slash,
turn every remaining `/` into `-`, and replace a parameter segment with what it identifies
followed by `-detail`. `/` → `home.md` · `/invoices` → `invoices.md` · `/invoices/new` →
`invoices-new.md` · `/invoices/:id` → `invoices-detail.md` · `/clients/:id/edit` →
`clients-detail-edit.md`. One doc per route; a modal or tab without its own route is a
section of its parent page's doc, not a file.

```markdown
# {Page Name}

**Route:** `{/path}` · **Access:** {roles that can reach it; what others see}
**Purpose:** {1–2 sentences: why this page exists, for whom}

## What's on it
{Each section/widget of the page, top to bottom, in plain English: what it shows, what the
user can do with it.}

## Behaviour by role
{One short block per role that sees something different — incl. multi-role users and
logged-out visitors.}

## Data
**Reads:** {what information is displayed and where it comes from, in words}
**Writes:** {what actions change data, and what they change}

## States & edge cases
{loading / empty / error behaviour; anything surprising: pagination, realtime updates,
permissions quirks, timezone handling}

## Related
{links to feature docs and other page docs}

---
*Last updated: {DATE} — {one line: what changed}*
```

## `documentation/features/<feature>.md`

```markdown
# {Feature Name}

**Status:** live | partial | planned · **Pages:** {links to page docs}
**Purpose:** {1–2 sentences}

## How it works (plain English)
{The full story a support person could work from: what triggers it, what the user sees at each
step, what happens behind the scenes described in words, what ends the flow.}

## Rules
{Every business rule this feature enforces — numbers, windows, limits, permissions. This is
the section future sessions rely on; keep it exact and current.}

## Data touched
{tables/collections written or read, in words — "creates a purchase record holding the fee
split", not SQL}

## Edge cases & known limits
{what happens on failure/cancellation/expiry/concurrent use; deliberate gaps left for later}

## History
| Date | Change |
|---|---|
| {DATE} | Created — {context} |
```

## `documentation/known-issues.md`

The code-reviewer and qa-tester append a 🟣 Minor entry here the moment they find one, so small issues are
never lost and never block a merge. Each entry carries a ready-to-run fix prompt. Seed the
file with the header and no entries.

```markdown
# {PROJECT_NAME} — Known Issues

Minor issues found in review and accepted for now. Each has a fix prompt: paste it to the
owning agent to fix it. **When an entry is fixed, delete it** in the same commit — this file
lists what is open, git history holds what was closed. Anything serious does not belong here;
it blocks the merge instead.

*(no open issues)*

<!-- entry format:
### KI-1 — short title
🟣 Minor · found YYYY-MM-DD · `path/file.ext:line` · owner: agent-name
**What:** the issue, one or two sentences
**Impact:** who notices, how rarely · **Why not fixed now:** reason
**Fix prompt:**
> self-contained prompt for the owning agent: what to change, the test to add, the gates to run
-->
```
