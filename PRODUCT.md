# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: a self-contained static HTML/CSS/JS app opened locally (double-click or a tiny local server). No build step, no backend. Excel parsing via a vendored SheetJS file so it works offline. Charts are hand-built SVG.

## Users

One person (the owner) reviewing their own Indian bank account. They export statements from netbanking as CSV or Excel, drop them in, and want to understand where money went: this month vs last, this year vs last, and what habits are changing.

## Product Purpose

"Where Did My Money Go" (wdmmg): turn raw bank statement exports into an analysis of income, spending, savings and habits over time. Success is the owner spotting a trend or leak (subscription creep, lifestyle inflation, a category spike) within a minute of loading their file.

## Positioning

Private by construction: statements never leave the browser. Built for Indian statement realities (UPI narrations, NEFT/IMPS/ACH, salary credits, Withdrawal/Deposit split columns, DD/MM/YYYY dates, ₹ with lakh grouping).

## Operating Context

Occasional review ritual (monthly, after salary credit, or year-end). Desktop first, laptop screen. Input files come from HDFC/ICICI/SBI/Axis/Kotak-style exports with header junk rows above the table.

## Capabilities and Constraints

- Upload one or more CSV/XLS/XLSX statements; auto-detect header row and columns (date, narration, debit, credit, or signed amount, balance); manual column mapping fallback.
- Rule-based categorisation from narration keywords; no AI or network calls.
- KPIs: income, spend, net cash flow, savings rate, MoM and YoY deltas, category trends, fixed vs discretionary, recurring/subscriptions, balance trend, emergency runway, largest transactions, weekday/weekend pattern, payment channel mix.
- Sample dataset bundled so the dashboard is explorable before upload.
- Undecided: budgets per category, PDF parsing, multi-account merging.

## Brand Commitments

Standing preference (confirmed after three direction rounds): a clearly modern finance dashboard, premium and distinctive, not a template. No metaphorical or retro-artifact visual worlds (ledgers, terminals, timetables, signage).

## Evidence on Hand

No real statements in the repo. Sample data is synthetic and must be labelled as sample.

## Product Principles

1. Privacy is the product: nothing leaves the device, and the UI says so plainly.
2. Answer "what changed?" before "what happened?": deltas lead, totals support.
3. Honest numbers: show the method (how a category or recurring item was detected) and never invent precision.
4. Indian money conventions are first-class, not localisation afterthoughts.

## Accessibility & Inclusion

Charts carry text equivalents (values in tables/tooltips), colour is never the only signal for up/down, keyboard reachable controls.
