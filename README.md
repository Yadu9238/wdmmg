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
| Where it went | Flow from income sources to categories, investments and money left over; needs / wants / saved against the 50-30-20 guide; largest payments |
| Categories | Every category's spend, share, change vs last month and last year, 6-month average and 12-month trend |
| Year on year | Calendar or Indian financial year (Apr–Mar) totals, savings rate and average monthly spend; cumulative spend vs previous years; year-to-date comparison and lifestyle-inflation check |
| Habits | Daily spending heatmap, weekday vs weekend, payment channels (UPI, card, auto-debit, transfers, cash) |
| Recurring | Subscriptions, rent, SIPs, EMIs and bills detected from regular rhythms, with price changes, yearly cost and next expected date |
| Balance | Month-end balance, monthly low points and how many months of essentials your balance covers |
| Transactions | Searchable ledger; change a category and every payment to that merchant follows (saved on this device) |

## How the numbers work

- **Money in**: salary, interest, refunds and other credits. Transfers between your own accounts are excluded everywhere.
- **Spent**: all other money out, except investments (SIPs, PPF, FDs, brokers).
- **Kept** = money in − spent (so it includes what you invested). **Savings rate** = kept ÷ money in.
- **Needs** are rent, groceries, bills, EMIs, insurance, health, transport, education and family support; everything else you spend is **wants**.
- **Runway** = month-end balance ÷ average monthly needs over the last six months.
- Categories come from keywords in the description (Swiggy, BESCOM, Zerodha, IRCTC and so on). Unmatched payments are marked *unmatched* in Transactions.

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
