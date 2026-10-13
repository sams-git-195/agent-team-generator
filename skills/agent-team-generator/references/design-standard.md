# Design standard — the bars that keep UI work from looking generated or being hard to use

Every role that builds UI (ui-ux-developer, fullstack-developer, a custom `developer`) carries
the "Design bar" and "Usability bar" sections below in its agent file, verbatim apart from
placeholders. The Design bar is how a screen looks; the Usability bar (v0.5.0) is how it works
— drawn from the standard references a senior product designer works to: Nielsen's ten
heuristics, Hick's / Fitts's / Jakob's laws, and WCAG 2.2. `{CORE_FLOWS}` comes from interview
Phase 3 (the jobs the product exists for); fill it with two or three named flows. It is
embedded, not referenced — this file does not exist in the target project. `AGENTS.md` §UI
holds the project's actual design direction and tokens; the bar says how to use them.

**An existing design system always wins.** In a repo that already has tokens, components and
a look, the job is fidelity: reuse them, extend them in their own idiom, never restyle. The
"commit to a direction" step applies when no direction exists yet — a greenfield UI, or a
`⚠️ undecided` palette in `AGENTS.md` — and then the direction is proposed to the user and
recorded in `AGENTS.md` §UI before the first screen is built.

## The block to embed (`## Design bar` + `## Usability bar`)

```markdown
## Design bar (generic-looking UI is a defect, not a style)

**Direction before pixels.** Read `AGENTS.md` §UI. If a design system exists, follow it
exactly. If the direction is `⚠️ undecided`, stop and propose one — who it is for, the tone
(e.g. editorial, utilitarian, playful, luxurious, brutalist), a type pairing, a palette as
tokens, and the one thing a visitor should remember — and get it approved and written into
`AGENTS.md` before building. Never invent a look screen by screen.

**Tokens, not values.** Colour, type scale, spacing, radius, shadow and motion come from
{DESIGN_TOKEN_SOURCE e.g. CSS variables in `src/styles/tokens.css`}. A raw hex, a one-off
`13px`, or an arbitrary margin in a component is a finding.

**Typography carries the design.** A deliberate display + body pairing with a real scale
(size, weight, line-height, measure of 45–75 characters). Hierarchy is visible at a squint:
one thing is most important on every screen.

**Colour with intent.** One dominant, one accent used sparingly, neutrals with a temperature.
Contrast meets WCAG AA (4.5:1 body, 3:1 large text and UI). Dark mode, if in scope, is
designed, not inverted.

**Layout with rhythm.** Spacing from the scale; alignment to a grid; density that fits the
content. Vary section composition — a page is not the same centred block repeated.

**Every state is designed**: hover, focus-visible, active, disabled, loading (skeletons that
match the final layout), empty (says what goes here and how to add it), error (says what
happened and offers the way out), success. Motion is short, purposeful, and respects
`prefers-reduced-motion`.

**Whole pages, not hero sections.** A page ships complete: navigation, real content
hierarchy, footer, responsive at {BREAKPOINTS}, title/meta/favicon, a 404, and forms with
validation and error copy. No lorem ipsum, no invented statistics or testimonials, no
placeholder images left in — real copy from the spec, or a clearly marked gap in the report.

**The slop list — if you catch yourself producing one, redo it:**
- the default font stack (Inter/Roboto/Arial/system) chosen by nobody
- purple-to-blue gradients on white; gradient text on the headline
- a centred hero, then three identical icon cards, then a CTA band
- every corner the same large radius, every card the same soft shadow
- emoji or a generic icon standing in for content
- glassmorphism, glow, or animation with no job to do
- cramped mobile: a desktop layout squeezed, not re-composed
- copy that could sit on any product ("Streamline your workflow", "Get started today")
- modals for everything: a confirm dialog on a reversible action, a modal opened from a modal
- a full-page spinner while one widget loads — skeletons, scoped to what is loading
- vague buttons ("Submit", "OK", "Click here") — a button says what it does ("Save draft",
  "Send invoice")
- errors that blame or speak developer ("Invalid input", "Error 500", "Something went wrong")
- an empty state that is only an illustration and "No data" — no next step offered
- a disabled button with no reason given — say what is missing, or validate on press
- placeholder text standing in for a label
- icon-only controls with no visible label or tooltip (universal close / search excepted)
- everything emphasised: several primary buttons, badges and colour on every row
- fake urgency or dark patterns (invented scarcity, pre-ticked opt-ins, confirm-shaming) — a
  trust failure, not a growth tactic

**Look at it.** Before handing off, open the page with browser tools at {BREAKPOINTS}, take
screenshots, and judge them against the direction as a designer would. If you cannot view
it, say "visually unverified" in the report — never claim a look you did not see.

**Do / Don't**

| Do | Don't |
|---|---|
| One primary action per screen, in the accent colour | Two equal-weight buttons competing |
| Smart defaults — the user's timezone, locale, last choice | Make people type what the app already knows |
| Undo after the fact ("Message deleted · Undo") for reversible actions | Confirm dialogs for reversible actions — keep them for money and deletion |
| Inline validation on blur, the fix stated next to the field | Validate only on submit, every error listed at the top |
| The final price, fees included, shown before the pay step | Reveal a fee at checkout |
| Progressive disclosure — advanced options behind "More" | Every setting on one screen |
| Optimistic UI for quick actions, rolled back on failure | Freeze the screen waiting on the server |
| Keep the user's input after an error | Clear the form when a request fails |
| The same action in the same place on every screen | Move the primary button around between pages |

## Usability bar (a screen that is hard to use is a defect, not a preference)

The Design bar is how it looks; this is how it works. Both are rules, both are checked.

- **Count the steps.** A flow you build or change lists its steps in your report. The core
  jobs have a budget — {CORE_FLOWS e.g. sign up → first value; search → checkout} — and a
  change that adds a step to one says why.
- **Few choices at a time (Hick's law).** Around 5–7 options in a menu or group; more go
  behind search, filters or "More". At most one primary and one secondary action per view.
- **Easy targets (Fitts's law).** Primary actions are large and, at the smallest breakpoint,
  within thumb reach (bottom of the screen or the end of the form); destructive actions sit
  apart from the primary one, never next to it with the same weight.
- **Familiar patterns (Jakob's law).** Search, forms, calendars and checkout behave the way
  people already know from the products they use daily. Novelty needs a reason written in
  the spec.
- **Visible system status.** Every action gives feedback within ~100 ms; anything slower than
  ~1 s shows progress. The user always knows where they are — page title, active nav item,
  step indicator in multi-step flows.
- **Recognition over recall.** Show recent items, saved filters and previous choices; never
  make the user remember something from another screen.
- **Calm screens.** One clear purpose per screen; the squint test (one thing dominates);
  whitespace before borders and boxes to group things. A dashboard answers "what do I do
  next?" before it shows statistics.
- **Words.** Plain language, sentence case, one term per concept everywhere (the glossary in
  `AGENTS.md` §UI wins; none yet → match the surrounding screen and flag the gap). Dates,
  times, numbers and money follow the user's locale.
- **Trust before payment** *(omit if the product takes no payments)*. What the user is buying,
  who from, and the cancellation or refund terms are visible before the pay step, and every
  amount is shown with its breakdown (price, fees, total).
- **WCAG 2.2 on top of the accessibility floor.** Focus is never hidden behind a sticky header
  or a toast (2.4.11), and anything done by dragging has a single-pointer alternative (2.5.7).
```

## Where else the bar lands

- `AGENTS.md` §UI: the design direction (tone, type pairing, palette as tokens, token file
  path) or the `⚠️ undecided` marker.
- `AGENTS.md` §UI: a short glossary (one term per concept) when the product has one, so the
  "Words" rule has something to point at; otherwise the rule says to match and flag.
- qa-tester and code-reviewer checklists: "design bar held — tokens used, states designed,
  no slop-list item" and "usability bar held — steps counted, one primary action, no confirm on
  a reversible action, input kept on error, price breakdown before payment" (a slop-list item
  or a usability-bar breach is 🟠 Should fix for both).
- The UI role's report lists **Flow steps** (before → after) for each flow it built or changed.
- Interview Phase 9 recommends the design skills (`frontend-design`, Impeccable, UI/UX Pro
  Max). When one is installed, add one line to the Design bar: "Load the `<skill>` skill
  before any UI work" — the skill deepens the bar; it does not replace it.
