# Where did my money go

A private, offline dashboard for Indian bank statements. Drop in the CSV or Excel export from netbanking and it shows where your money went: month on month, year on year, by category, and by habit.

Nothing is uploaded. The page has no server and makes no network requests; files are read and analysed in your browser.

## Run it

Open `index.html` in Chrome, Edge or Firefox (double-click works).

If your browser or company policy blocks local files, serve the folder instead:

```powershell
cd path\to\wdmmg
python -m http.server 8000 --bind 127.0.0.1
# then open http://127.0.0.1:8000
```

The dashboard opens with a synthetic sample statement so you can explore it. **Download this sample CSV** in the top banner shows the format it expects.

## Import your statements

1. In netbanking, open your account statement and download it as **Excel**, **CSV** or **Delimited** (PDF is not supported).
2. Click **Import statements** and drop in one or more files. Several months or years of files from the same account can be added together; rows that appear in two files are counted once.
3. Check the detected columns (date, description, debit, credit or a single amount with a Dr/Cr marker, balance) and the preview, then click **Analyse**.
4. Tick **Remember on this device** if you want it to reopen with your data. **Clear data** removes it.

Tested layouts: HDFC (Withdrawal/Deposit columns, `dd/mm/yy`), SBI (Debit/Credit, `01 Aug 2026`), ICICI (Amount + `Dr / Cr`, Excel dates). Other banks usually work because columns are matched by name; if not, pick them by hand in the import panel.

## What it shows

| Section | Measures |
| --- | --- |
| Overview | The month's verdict in one sentence; a 24-month cash-flow chart (click or use arrow keys to pick a month); money in, spent, invested, kept, savings rate and balance against last month and the same month last year; automatic "worth a look" notes |
| Where it went | Flow from income sources to categories, investments and money left over; needs / wants / saved against the 50-30-20 guide; largest payments. Switch between the selected month, its full year (calendar or April–March), or all to date (first to last transaction in your statements) |
| Categories | Every category's spend and share. Month view: change vs last month and last year, 6-month average, 12-month trend. Full-year view: change vs the same months last year, average per month, month-by-month trend. All-to-date view: total, average per month and each year's total side by side |
| Investments | Money moved into SIPs, PPF, NPS, deposits and brokers: monthly chart by instrument, share of income invested, last 12 months vs the 12 before, regular monthly commitment, withdrawals/redemptions, and each destination's step-ups and SIP consistency. Returns aren't visible in a bank statement, so it tracks what you put in |
| Year on year | Calendar or Indian financial year (Apr–Mar) totals, savings rate and average monthly spend; cumulative spend vs previous years; year-to-date comparison and lifestyle-inflation check |
| Habits | Daily spending heatmap, weekday vs weekend, payment channels (UPI, card, auto-debit, transfers, cash) |
| Recurring | Subscriptions, rent, SIPs, EMIs and bills detected from regular rhythms, with price changes, yearly cost and next expected date |
| Balance | Month-end balance, monthly low points and how many months of essentials your balance covers |
| Transactions | Searchable ledger; category edits default to one transaction, with an optional merchant-wide rule (saved on this device) |

## How the numbers work

- **Money in**: salary, interest, refunds and other credits. Transfers between your own accounts are excluded everywhere.
- **Shared-expense repayments**: money friends return for their share is an expense reimbursement, not earnings or an own-account transfer. Assign each repayment to the original spending category using **This transaction only**. A INR 3,000 dinner with INR 2,000 repaid then becomes INR 1,000 net dining spend. Repayments reduce spending in the month received, even if the original expense was earlier. Refunds & cashback instead increases Money in.
- **Spent**: all other money out, except investments (SIPs, PPF, FDs, brokers).
- **Kept** = money in − spent (so it includes what you invested). **Savings rate** = kept ÷ money in.
- **Needs** are rent, groceries, bills, EMIs, insurance, health, transport, education and family support; everything else you spend is **wants**.
- **Runway** = month-end balance ÷ average monthly needs over the last six months.
- Categories come from keywords in the description (Swiggy, BESCOM, Zerodha, IRCTC and so on). Unmatched payments are marked *unmatched* in Transactions.
- Before editing a category, choose **This transaction only** (the default) or **All payments from this merchant**. Merchant rules apply only to the same direction (incoming or outgoing); individual choices take priority. Choosing a merchant rule removes the selected transaction's exception but preserves other individual choices. Transaction choices survive reloads and re-imports of the same date, description, amount and balance, independently of row order. Indistinguishable duplicate rows share a choice. Saved transaction keys contain those fields locally, even when statements are not remembered; **Clear data** removes both statements and category choices.
- `AUTOPAY` (also `AUTO PAY` / `AUTO-PAY`) is ignored when identifying merchants, so it cannot group unrelated payees under one category rule. It stays in the original description and can still identify the payment channel as auto-debit. Previously saved rules based on an `AUTOPAY` merchant name no longer match the corrected names; categorise those merchants again if needed. Autopay descriptions with no identifiable payee use the full description as their rule key rather than sharing an Unknown rule.

## Tests

With Node.js installed, run `node --test` for the merchant categorisation regression tests. No package installation is needed.

## Files

```
index.html            page structure
assets/styles.css     design system and layout
assets/app.js         rendering and interaction
assets/parse.js       CSV/Excel reading, column detection, Indian date and amount formats
assets/categorize.js  categories, keyword rules, merchant and channel detection
assets/analyze.js     monthly/yearly maths, recurring detection, insights
assets/charts.js      hand-drawn SVG charts
assets/sample.js      synthetic sample statement generator
vendor/               SheetJS (Excel reader) and Anek Latin font, with licences
```
