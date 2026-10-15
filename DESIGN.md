---
name: Where did my money go
description: A private, on-device reading of Indian bank statements that says what changed before it shows what happened.
colors:
  bg: "oklch(0.975 0.004 165)"
  surface: "oklch(0.995 0.002 165)"
  surface-2: "oklch(0.955 0.006 165)"
  surface-3: "oklch(0.925 0.008 165)"
  rule: "oklch(0.905 0.006 165)"
  rule-2: "oklch(0.84 0.008 165)"
  rule-hover: "oklch(0.78 0.01 165)"
  ink: "oklch(0.23 0.014 175)"
  ink-2: "oklch(0.4 0.012 175)"
  ink-3: "oklch(0.5 0.01 175)"
  on-ink: "oklch(0.985 0.004 165)"
  jade: "oklch(0.58 0.12 168)"
  jade-2: "oklch(0.74 0.08 168)"
  jade-ink: "oklch(0.45 0.1 168)"
  jade-wash: "oklch(0.945 0.03 168)"
  persimmon: "oklch(0.64 0.17 40)"
  persimmon-ink: "oklch(0.52 0.16 36)"
  persimmon-wash: "oklch(0.955 0.025 40)"
  in-bar: "oklch(0.7 0.035 235)"
  in-bar-sel: "oklch(0.45 0.07 240)"
  out-bar: "oklch(0.83 0.012 165)"
  out-bar-sel: "oklch(0.55 0.02 175)"
  inv-bar: "oklch(0.86 0.045 168)"
  inv-bar-sel: "oklch(0.68 0.09 168)"
  need: "oklch(0.55 0.05 235)"
  want: "oklch(0.72 0.1 50)"
  heat-1: "oklch(0.89 0.012 240)"
  heat-2: "oklch(0.79 0.022 240)"
  heat-3: "oklch(0.66 0.032 240)"
  heat-4: "oklch(0.5 0.035 240)"
  heat-5: "oklch(0.32 0.03 240)"
typography:
  display:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\""
  lede:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "23px"
    fontWeight: 420
    lineHeight: 1.42
    letterSpacing: "-0.012em"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.018em"
  figure:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.015em"
    fontFeature: "\"tnum\""
  title:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  title-sm:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\""
  control:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "13.5px"
    fontWeight: 500
  label:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  axis:
    fontFamily: "Anek Latin, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    fontFeature: "\"tnum\""
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, SF Mono, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
rounded:
  bar: "2px"
  swatch: "3px"
  inner: "6px"
  sm: "7px"
  seg: "9px"
  md: "10px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 3vw, 40px)"
  page: "1360px"
  row: "10px"
  stack: "28px"
  panel-gap: "48px"
  section: "64px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-hover:
    backgroundColor: "{colors.surface-2}"
  button-active:
    backgroundColor: "{colors.surface-3}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "oklch(0.32 0.02 175)"
  button-primary-active:
    backgroundColor: "oklch(0.18 0.012 175)"
  button-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    width: "34px"
    height: "34px"
  segmented:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.seg}"
    padding: "3px"
  segmented-option:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.inner}"
    padding: "0 11px"
    height: "26px"
  segmented-option-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  link:
    textColor: "{colors.jade-ink}"
    typography: "{typography.control}"
  link-danger:
    textColor: "{colors.persimmon-ink}"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 30px 0 11px"
    height: "34px"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px 0 34px"
    height: "34px"
  pill:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "22px"
  source-tag:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "22px"
  source-tag-yours:
    backgroundColor: "{colors.jade-wash}"
    textColor: "{colors.jade-ink}"
  chip-filter:
    backgroundColor: "{colors.jade-wash}"
    textColor: "{colors.jade-ink}"
    rounded: "{rounded.pill}"
    padding: "0 4px 0 10px"
    height: "28px"
  nav-link:
    textColor: "{colors.ink-3}"
    typography: "{typography.control}"
    rounded: "{rounded.inner}"
    padding: "8px 10px"
  nav-link-active:
    textColor: "{colors.ink}"
  drop-zone:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "30px 20px"
  drop-zone-hover:
    backgroundColor: "{colors.jade-wash}"
  verdict-note-ok:
    backgroundColor: "{colors.jade-wash}"
    textColor: "oklch(0.36 0.07 168)"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  verdict-note-warn:
    backgroundColor: "{colors.persimmon-wash}"
    textColor: "oklch(0.42 0.12 36)"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  tooltip:
    backgroundColor: "oklch(0.22 0.014 175)"
    textColor: "oklch(0.88 0.008 165)"
    rounded: "{rounded.seg}"
    padding: "9px 11px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "oklch(0.95 0.005 165)"
    rounded: "{rounded.md}"
    padding: "12px 16px"
---

# Design System: Where did my money go

## Overview

**Creative North Star: "The Plain-Spoken Analyst"**

The system reads like a sharp analyst talking you through your own month: a sentence first, then the comparison table that proves it, then the charts that let you check the working. Everything sits on a cool, faintly green paper-white ground in graphite ink. Structure comes from hairline rules and whitespace, not from boxed cards; the page is one continuous sheet divided into sections by single horizontal rules.

Colour is spent like money in a careful budget. Neutrals carry almost all of the page. One jade accent marks the thing you are looking at (the selected month, the active control's focus ring) and the money you kept. Persimmon appears only where money went wrong. Data series rest in low-chroma tints and only saturate for the selected month, so the eye always lands on "this month" first. Charts are hand-drawn SVG sharing one ₹ scale, typeset in the same face as the prose.

Anek Latin, with its native ₹ and tabular figures switched on everywhere, gives the numbers a single consistent rhythm. Indian money conventions are typographic rules here, not localisation: lakh grouping, `L` and `Cr` abbreviations, a true minus sign. The world is light-only; there is no dark theme.

**Key Characteristics:**
- Cool paper-white ground (hue 165) with graphite ink (hue 175); neutrals do the work.
- Hairline rules instead of cards; sections separated by one 1px rule.
- A single jade accent for selection and kept money; persimmon reserved for overspend.
- Words and comparison tables lead; charts support and double as controls.
- Tabular figures and Indian number formatting on every number, including inside SVG.
- Flat at rest; only floating things (tooltip, toast) cast shadows.

## Colors

A near-monochrome cool-graphite palette with one jade voice, one persimmon warning, and quiet slate data ramps.

### Primary
- **Jade** (`jade`): the selection and "kept money" colour. The kept-money line on the cash-flow chart, the selected dot, the active-section underline in the top bar, focus outlines, the checkbox accent, the text caret, the "Left in account" flow node, the current-year cumulative line, the safety-net runway bar and target line.
- **Jade Ink** (`jade-ink`): jade at text contrast. Positive figures in the verdict and tables, good deltas, links, the "On this device" privacy badge, the "yours" category marker.
- **Pale Jade** (`jade-2`): the lighter jade for "Invested" in the flow diagram, the remaining-saved segment of the needs/wants bar, the brand mark's flow stroke, and link colour on the dark toast.
- **Jade Wash** (`jade-wash`): selected-column backdrop on the cash-flow chart, current-year table row, drop-zone hover, filter chips, the "Your data" tag, text selection.

### Secondary
- **Persimmon** (`persimmon`): overspend as a mark. Negative kept-money dots, "From your balance" flow input, the income marker on the needs/wants bar, the shortfall swatch.
- **Persimmon Ink** (`persimmon-ink`): overspend as text. Bad deltas, negative verdict figures, "over guide" status, warning lines, destructive links.
- **Persimmon Wash** (`persimmon-wash`): backdrop for error file cards and the warning verdict note.

### Tertiary (data ramps)
- **Cash-flow series**: money in uses slate blue (`in-bar` at rest, `in-bar-sel` selected); spent uses grey-green (`out-bar`, `out-bar-sel`); invested uses pale jade (`inv-bar`, `inv-bar-sel`). Rest tints are deliberately low-chroma so the selected column's saturated pair reads as the subject.
- **Needs / Wants** (`need`, `want`): a muted slate and a soft apricot for the 50/30/20 split bar and its swatches; saved/invested is jade.
- **Spending intensity** (`heat-1` to `heat-5`, on a `surface-2` zero step): a single slate ramp (hue 240) for the daily heatmap. `heat-4` doubles as the weekend bar colour in the weekday chart, against `out-bar` weekdays.
- **Category colours**: generated, not hand-picked. Every spending and income category is `oklch(0.68 0.1 <hue>)` with a per-category hue (defined alongside the categorisation rules); own-account transfers are a neutral `oklch(0.72 0.01 160)`. They appear only as small marks (10px swatch, 6px share bar, sparkline's selected bar, flow nodes and ribbons) and always sit next to the category name.
- **Payment channels**: a fixed seven-colour set (UPI, Card, Auto-debit, Bank transfer, ATM cash, Cheque, Other) at moderate chroma, used for the channel-mix bar and its table swatches.

### Neutral
- **Paper** (`bg`): the page ground.
- **Sheet** (`surface`): raised strips that belong to the chrome: source bar, import panel, footer, control fills, resting chart dots.
- **Tint 1 / Tint 2** (`surface-2`, `surface-3`): hover fills, pill backgrounds, empty bar tracks, the heatmap zero step, sparkline bars, button press.
- **Hairline / Hairline Strong** (`rule`, `rule-2`): section dividers and table row rules (`rule`); control borders, table header underlines, totals rules, scrollbar thumbs (`rule-2`). `rule-hover` darkens control borders on hover.
- **Graphite** (`ink`): primary text, the primary button fill, the balance line, the flow diagram's central node.
- **Graphite 2 / Graphite 3** (`ink-2`, `ink-3`): supporting prose and secondary values (`ink-2`); captions, axis labels, column headers, inactive nav (`ink-3`).
- **On Ink** (`on-ink`): text and marks on graphite fills.

### Named Rules
**The One Jade Rule.** Jade means "selected" or "kept". It never decorates; if a jade element is neither the current selection, a focus state, nor money the owner kept or saved, it is the wrong colour.

**The Persimmon Is Overspend Rule.** Persimmon appears only where money went the wrong way or something failed. It is never a second brand accent.

**The Triangle-Plus-Tint Rule.** Colour encodes good or bad, a filled SVG triangle encodes up or down, and screen-reader text says "up" or "down". Spending up is a persimmon up-triangle; spending down is a jade down-triangle. Colour is never the only signal.

**The Muted-Until-Selected Rule.** Chart series rest in low-chroma tints; only the selected month takes the saturated `-sel` variants and the jade-wash column behind it.

## Typography

**Display Font:** Anek Latin (Ek Type, vendored variable font, weights 100 to 800, width 75% to 125%; latin and latin-ext subsets so ₹ renders natively), falling back to Segoe UI and system-ui.
**Body Font:** Anek Latin, same stack.
**Label/Mono Font:** ui-monospace (Cascadia Mono, SF Mono, Consolas), used only for raw bank narration text.

**Character:** One humanist sans does everything, from the month title to chart axes. Its compact, slightly condensed figures with tabular spacing make columns of rupees align without a second numeric face.

### Hierarchy
- **Display** (600, 34px, 1.1, -0.03em): the selected month title only ("September 2026"). Steps to 26px at 720px and below.
- **Lede** (420, 23px, 1.42, -0.012em): the verdict sentence under the month, max 62ch, in `ink-2` with key figures bolded to 600 in `ink`, `jade-ink` or `persimmon-ink`. Steps to 18px on mobile. The runway sentence uses the same voice at 19px.
- **Headline** (600, 23px, 1.2, -0.018em): section titles. Steps to 20px on mobile. Followed by an `ink-3` sentence (max 80ch) that states the comparison being made.
- **Figure** (600, 21px, 1.15, -0.015em): the lead number in each insight row, coloured by tone.
- **Title** (600, 19px, -0.01em): sub-section titles such as the insight list heading and the import panel heading.
- **Title Small** (600, 15px, -0.005em): panel titles inside a section ("Cash flow by month", "How you pay") and footer headings; also the wordmark.
- **Body** (400, 14.5px, 1.5): prose and table cells; 14px at 720px and below. Explanatory notes cap at 70 to 72ch.
- **Control** (500, 13.5px): buttons, nav links, selects, links, insight detail text.
- **Label** (500, 12px): table column headers, pills, figure notes, field labels. Sentence case, no tracking.
- **Axis** (400, 11px, `ink-3`): chart axes and scale labels; year labels on the time axis are 600 in `ink-2`.

### Named Rules
**The Tabular Everywhere Rule.** `tnum` is set on the body and on every SVG `text`; any new number, in prose, table or chart, inherits it. Never switch to proportional figures for a "nicer" headline number.

**The Indian Money Rule.** Rupees always carry the ₹ sign with en-IN lakh grouping (₹1,78,974). Compact values use `k`, `L` and `Cr` (₹5.8k, ₹4 L, ₹1.2 Cr). Negatives use a true minus (−), missing values an em dash (—).

**The Sentence-Case Rule.** Every label, header, tag and button is sentence case at normal tracking. Hierarchy comes from size and weight steps, not from capitals or letterspacing.

## Layout

A single centred column, max 1360px (`page`), with fluid side gutters (`gutter`, 16px to 40px). The top bar is sticky at 60px (56px on mobile) on the paper ground with a hairline bottom rule; anchor jumps are offset by 76px of scroll padding.

The page is a vertical sequence of sections, each opening with a 1px `rule` top border and 64px of top padding (48px on mobile); the first section has no rule and 34px. Inside a section, content splits into asymmetric two-column grids: 7fr:5fr for the overview (chart beside comparison matrix, 40px gap) and 8fr:4fr for flow, year-on-year and balance (48px gap); the habits pair is an even 1:1 split at 56px. The footer is a 3fr:2fr split on a `surface` strip.

Vertical rhythm is built from repeated steps rather than a strict scale: 4 to 6px between a heading and its note, 10 to 14px inside control groups, 22px under section heads, 28 to 32px between blocks in a section, 40 to 56px between major panels. List and table rows breathe at 9 to 11px vertical padding (`row`) separated by hairlines, with no zebra striping; the first and last cells lose their outer padding so tables align flush with prose.

Responsive behaviour:
- **1180px and below:** the section nav in the top bar is hidden.
- **1024px and below:** every two-column grid stacks to one column (36 to 40px gaps); the footer stacks.
- **720px and below:** type steps down (body 14px, display 26px, lede 18px, headline 20px); the wordmark text hides leaving the mark; optional table columns hide and their key facts reappear as a small `ink-3` line under the row heading; insight rows stack with the figure inline; table cell padding tightens to 4 to 6px; the chart's month axis shortens to single initials.
- **420px and below:** the privacy badge hides.
- **Print:** chrome (top bar, import, source bar, ledger controls, tooltip, toast) is removed and the ground goes white.

### Named Rules
**The Hairline Not Box Rule.** Analysis lives on the open sheet, divided by 1px rules. Bordered or tinted containers are reserved for objects the owner handles (the drop zone, imported-file cards) and for the single tinted verdict note; dashboard content is never wrapped in cards.

## Elevation & Depth

The system is flat. Resting surfaces separate by tone (`bg` versus `surface`) and by hairlines, never by shadow. The sticky top bar has a rule, not a shadow. Depth appears only on things that float above the page and disappear again.

### Shadow Vocabulary
- **Tooltip lift** (`box-shadow: 0 10px 28px -10px oklch(0.2 0.02 175 / 0.45), 0 2px 6px -2px oklch(0.2 0.02 175 / 0.25)`): the dark chart and badge tooltip.
- **Toast lift** (`box-shadow: 0 16px 36px -12px oklch(0.2 0.02 175 / 0.5)`): the bottom-centre confirmation toast.

### Named Rules
**The Only-Floating-Things-Cast Rule.** A shadow means "this is temporary and above the page". Anything that stays in the layout gets a hairline or a tone step instead.

## Shapes

Gently rounded and small. Controls use a 7px radius (`sm`); larger handled objects (drop zone, file cards, toast, verdict note) use 10px (`md`); the segmented control's track is 9px with 6px options nested inside (`seg`, `inner`), and the tooltip shares the 9px corner. Tags, pills and filter chips are full capsules (`pill`). Data marks are nearly square: chart bars and flow nodes at 2px (`bar`), legend swatches and heatmap cells at about 3px (`swatch`), bar-chart columns at 3px, horizontal composition bars at 5px with their segments clipped to the track. Borders are 1px throughout, except the drop zone's 1.5px dashed outline. The brand mark is a 28px graphite square at 7px radius holding a jade S-shaped flow line that starts from a pale dot.

## Components

### Buttons
Quiet, compact and square-shouldered; the graphite primary is the only heavy fill on the page.
- **Shape:** gently rounded (7px), 34px tall, 1px `rule-2` border, 8px gap between a 16px stroke icon and the label.
- **Default:** `surface` fill with `ink` text; hover steps to `surface-2` with a `rule-hover` border, press to `surface-3`.
- **Primary:** `ink` fill and border with `on-ink` text ("Import statements", "Analyse"); hover lightens slightly, press darkens. One per context.
- **Icon:** a 34px square default button (month previous/next, close).
- **Disabled:** 45% opacity, not-allowed cursor, keeps its resting fill.
- **Transitions:** background, border and colour over 160ms on the shared ease.

### Segmented control
- **Style:** a `surface` capsule-ish track (9px radius, 1px `rule-2` border, 3px padding) holding 26px options at 6px radius in `ink-2`.
- **State:** hover fills `surface-2`; the pressed option (`aria-pressed="true"`) fills `ink` with `on-ink` text. Used for range (12 mo / 24 mo / All), calendar vs financial year, direction and period filters.
- **Period pair:** "Where it went" and "Categories" carry a shared period control in their section-head row, right-aligned: selected month / full year / all to date (first to last transaction, independent of the selected month), followed by a second Calendar / Apr–Mar control that appears only for the non-month views. Both sections and the Year-on-year toggle stay in sync; switching never changes the selected month.

### Investments chart
- Monthly stacked bars by instrument in a jade-family ramp (investments are kept money): mutual funds `oklch(0.58 0.12 168)`, stocks `oklch(0.42 0.08 180)`, PPF `oklch(0.76 0.08 150)`, NPS `oklch(0.64 0.08 120)`, deposits `oklch(0.7 0.06 215)`, other `oklch(0.8 0.02 165)`. Withdrawals and redemptions hang below the zero line in a pale warm tint `oklch(0.86 0.03 40)`. Columns share the cash-flow chart's hover/selected wash and clicking one selects that month.

### Links
- **Style:** `jade-ink`, weight 500, underlined at 3px offset with the underline at 35% opacity; hover brings the underline to full colour. Trailing 13px chevron icons for "Show payments". The destructive "Clear data" link swaps to `persimmon-ink`.

### Pills, tags and chips
- **Pill:** 22px capsule, `surface-2` fill, `ink-2` 12px label; an 18px small variant marks "partial" and "stopped" inline.
- **Source tag:** 22px capsule at 600 weight; "Sample data" on `surface-3`, "Your data" on `jade-wash` in `jade-ink`.
- **Filter chip:** 28px `jade-wash` capsule in `jade-ink` with a 22px circular clear button that tints jade on hover.
- **Method marker:** an 11px dotted-underlined word after a ledger category ("unmatched" in `ink-3`, "yours" in `jade-ink`) that explains how the category was assigned.

### Inputs / Fields
- **Select and search:** 34px, 1px `rule-2` border, 7px radius, `surface` fill; the select carries a drawn chevron, the search a 16px inset icon with 34px left padding. Hover darkens the border to `rule-hover`. In tables the category select drops to 30px.
- **Checkbox:** native, 16px, `accent-color` jade, label in `ink-2`.
- **Focus:** every focusable element gets a 2px jade outline at 2px offset (4px radius). Clickable table rows instead show a 2px inset jade bar on their leading cell plus a `surface-2` fill.
- **Error:** imported-file cards that fail take a `persimmon-wash` fill, a persimmon-tinted border and `persimmon-ink` text; warnings tint only the border.

### Navigation
- **Top bar:** wordmark (mark plus 15px/600 name) at left, section links in the middle, then the "On this device" lock badge in `jade-ink` and the primary import button at right.
- **Section links:** 13.5px/500 in `ink-3`, 6px radius, hover to `ink` on `surface-2`. The active section turns `ink` and gains a 2px jade underline sitting on the bar's bottom rule. Hidden below 1180px; the page then relies on scrolling.
- **Source bar:** a `surface` strip under the top bar stating whose data is shown (tag, one-line description, download/import links) so sample data is never mistaken for real data.

### Comparison tables
The workhorse component; the system's alternative to KPI tiles.
- **Structure:** full-width, collapsed borders, `rule` between rows, `rule-2` under the header and above totals. Headers are 12px/500 `ink-3`; numbers right-aligned and never wrapped.
- **Current column:** the selected month's column is 600 in `ink`; the key row ("Kept") is `jade-ink`; the current year's row takes a `jade-wash` fill.
- **Deltas:** 13px/500 with a 9px filled triangle; good is `jade-ink`, bad is `persimmon-ink`, flat or unavailable is `ink-3` at 400 ("same", "—"). A smaller 400-weight percentage may follow an absolute delta.
- **Row links:** whole rows open the matching transactions; hover and focus fill `surface-2`.
- **Category cell:** 10px rounded swatch in the category colour, name at 500, kind ("Needs", "Wants") as a small `ink-3` suffix; a 6px share bar and a 12-month sparkline (bars in `surface-3`, the selected month in the category colour) complete the row.

### Insight list
A ranked list that leads with the number. Each row is a three-part grid (190px figure column, explanation, action): the figure in Figure type coloured by tone with a 12px note under it, a 600-weight title and `ink-2` detail (max 72ch), and a "Show payments" link. Rows are separated by hairlines, under a `rule-2` top rule. On mobile the figure and its note sit inline above the text.

### Charts (signature component)
Hand-built SVG on the shared ₹ scale, typeset in Anek Latin with tabular figures.
- **Axes and grid:** 11px `ink-3` labels in compact ₹; 1px `rule` gridlines with crisp edges, the zero line in `rule-2`.
- **Cash-flow chart (also the month selector):** money in above zero, spent and invested stacked below, in 2px-radius bars up to 18px wide; a 1.75px jade kept-money line with hollow `surface` dots (persimmon-ringed when negative). Each month is a full-height hit column that fills `surface-2` on hover and `jade-wash` when selected, where its bars switch to the `-sel` colours and its dot fills solid. Partial months fade to 55%. The columns form a keyboard radio group (one tab stop on the selected month), focus ringed in jade.
- **Flow diagram:** 10px nodes in category colours, translucent ribbons (32% out, 18% in, 60% on hover), a graphite central node, labels at 12.5px/500 with compact values in `ink-3`; "Left in account" is labelled in `jade-ink`.
- **Composition bars:** 14px tracks at 5px radius (needs/wants/saved, payment channels) with a dashed guide marker and a persimmon income marker where relevant; always paired with a row list or table carrying the values.
- **Lines over time:** current period jade at 2.5px, previous `ink-2` at 1.75px, older `rule-2` dashed 4/4, with end-of-line labels instead of a legend. The balance line is graphite with min-to-close range ticks and a dotted jade target line.
- **Heatmap:** 2.5px-radius day cells on the slate `heat` ramp, hover outlined in `ink`, with a Less-to-More legend stating the darkest threshold.
- **Every chart has a text equivalent:** tooltips on marks, an adjacent table or list with the values, and `role="img"` labels.

### Tooltip and toast
- **Tooltip:** dark graphite panel (9px radius, 9px 11px padding, 12.5px text, light ink), a 600-weight first line in `on-ink`, tooltip lift shadow; follows the pointer and never takes pointer events.
- **Toast:** graphite capsule-rectangle (10px radius) bottom-centre, max 640px, with a pale-jade action link; rises 12px and fades in over 220ms.

### Drop zone and file cards
- **Drop zone:** a 1.5px dashed `rule-2` outline on the paper ground (10px radius), centred file icon, bold prompt with an inline "choose files" link and an `ink-3` reassurance line. Hover or drag-over turns the border jade and the fill `jade-wash`; keyboard focus gets the jade outline.
- **File card:** 1px `rule` border, 10px radius, 14px 16px padding on the paper ground, with filename, bank pill, a stats line and an auto-filling grid of column-mapping selects.

### Motion
One ease for everything: `cubic-bezier(0.16, 1, 0.3, 1)`, a fast-settling ease-out. State changes (hover, press, selection) take 120 to 160ms; the toast 220ms; when the month changes, swapped panels fade up from 40% opacity and 3px lower over 260ms. Reduced-motion preference removes the swap animation and zeroes all transitions.

## Do's and Don'ts

### Do:
- **Do** lead every analytical view with a sentence or a comparison (this period, last period, delta, same period last year) before any chart.
- **Do** keep jade for the selected state, focus, and kept or saved money only (The One Jade Rule).
- **Do** pair every up/down colour with a filled triangle and screen-reader "up"/"down" text (The Triangle-Plus-Tint Rule).
- **Do** set tabular figures and en-IN grouping on every rupee value, with compact `k` / `L` / `Cr` on chart axes and labels.
- **Do** separate sections and rows with 1px hairlines (`rule`, `rule-2`) on the paper ground.
- **Do** give every chart a text equivalent (adjacent table or list plus tooltips) and make its marks keyboard reachable where they act as controls.
- **Do** derive new category colours from the `oklch(0.68 0.1 <hue>)` formula and always print the category name beside its swatch.
- **Do** label sample data as sample wherever it is shown.

### Don't:
- **Don't** wrap dashboard analysis in cards or tiles; boxed containers belong only to the drop zone, imported-file cards and the tinted verdict note.
- **Don't** introduce four-up KPI tiles or donut charts; comparisons are tables with deltas, shares are horizontal bars.
- **Don't** use persimmon for anything except overspend, errors or a negative balance effect.
- **Don't** put shadows on resting surfaces; only the tooltip and toast float.
- **Don't** use uppercase labels, letterspaced eyebrows or a second display face; hierarchy is size and weight in Anek Latin.
- **Don't** saturate unselected chart series; resting data stays in its low-chroma tint.
- **Don't** build metaphorical or retro-artifact visuals (ledger paper, terminals, timetables, signage); this is a modern finance dashboard.
- **Don't** add a dark theme by inverting tokens; the system is defined light-only.
