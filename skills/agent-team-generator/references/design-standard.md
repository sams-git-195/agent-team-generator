# Design standard — the bar that keeps UI work from looking generated

Every role that builds UI (ui-ux-developer, fullstack-developer, a custom `developer`) carries
the "Design bar" section below in its agent file, verbatim apart from placeholders. It is
embedded, not referenced — this file does not exist in the target project. `AGENTS.md` §UI
holds the project's actual design direction and tokens; the bar says how to use them.

**An existing design system always wins.** In a repo that already has tokens, components and
a look, the job is fidelity: reuse them, extend them in their own idiom, never restyle. The
"commit to a direction" step applies when no direction exists yet — a greenfield UI, or a
`⚠️ undecided` palette in `AGENTS.md` — and then the direction is proposed to the user and
recorded in `AGENTS.md` §UI before the first screen is built.

## The block to embed (`## Design bar`)

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

**Look at it.** Before handing off, open the page with browser tools at {BREAKPOINTS}, take
screenshots, and judge them against the direction as a designer would. If you cannot view
it, say "visually unverified" in the report — never claim a look you did not see.
```

## Where else the bar lands

- `AGENTS.md` §UI: the design direction (tone, type pairing, palette as tokens, token file
  path) or the `⚠️ undecided` marker.
- qa-tester and code-reviewer checklists: "design bar held — tokens used, states designed,
  no slop-list item" (a slop-list item is 🟠 Should fix for the code-reviewer, Medium for QA).
- Interview Phase 9 recommends the design skills (`frontend-design`, Impeccable, UI/UX Pro
  Max). When one is installed, add one line to the Design bar: "Load the `<skill>` skill
  before any UI work" — the skill deepens the bar; it does not replace it.
