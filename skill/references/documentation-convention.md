# Documentation convention — templates for `documentation/`

Plain-English living docs: written for humans and for future model sessions with zero context.
The PM creates/updates them as part of Definition of Done (protocol §4); qa-tester verifies.
Descriptive, not implementation dumps — a reader should understand the product without opening
the code. File paths may be named as anchors, but no code blocks longer than a signature.

Seed on generation: `README.md` with the sections below (empty tables are fine on day one),
plus one page doc per route the interview named (Phase 1, question 5) — never invent pages the
user didn't name. Add a `.gitkeep` to any directory left empty so git tracks it.

## `documentation/README.md`

```markdown
# {PROJECT_NAME} — Product Documentation

Plain-English descriptions of every page and feature. Maintained by the project-manager;
updated before any feature is marked Done. If code and these docs disagree, the code is right —
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
