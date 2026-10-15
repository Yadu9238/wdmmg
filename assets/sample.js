(function () {
  "use strict";
  const WD = (window.WD = window.WD || {});

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const pad = (n) => String(n).padStart(2, "0");

  // A synthetic HDFC-style savings account export for a salaried professional in Bengaluru.
  WD.buildSampleCSV = function () {
    const r = mulberry32(20260915);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const between = (a, b) => a + r() * (b - a);
    const int = (a, b) => Math.floor(between(a, b + 1));
    const amt = (a, b, step = 1) => Math.max(step, Math.round(between(a, b) / step) * step);
    const ref = () => String(Math.floor(r() * 9e11) + 1e11);
    const card = "4XXXXXXXXXXX3812";
    const bankCode = () => pick(["YESB0YBLUPI", "HDFC0MERUPI", "ICIC0DC0099", "UTIB0000553", "SBIN0016225"]);
    const upi = (name, vpa, note = "PAYMENT FROM PHONE") => `UPI-${name}-${vpa}-${bankCode()}-${ref()}-${note}`;

    const tx = [];
    const add = (y, m, d, n, a) => {
      const last = new Date(y, m + 1, 0).getDate();
      tx.push({ d: new Date(y, m, Math.min(Math.max(1, d), last)), n, a: Math.round(a * 100) / 100, o: tx.length });
    };
    const out = (y, m, d, n, a) => add(y, m, d, n, -Math.abs(a));
    const inc = (y, m, d, n, a) => add(y, m, d, n, Math.abs(a));

    const people = [
      ["ARJUN MENON", "arjun.menon@okhdfcbank"], ["PRIYA NAIR", "priyanair92@okaxis"], ["ROHIT VERMA", "9845012345@ybl"],
      ["SNEHA RAO", "sneha.rao@oksbi"], ["KIRAN KUMAR", "kirankumar@ibl"], ["MEERA IYER", "meera.iyer@okicici"],
    ];
    const shops = [["SRI LAKSHMI STORES", "q781234567@ybl"], ["FRESH FRUITS HSR", "paytmqr2810050501@paytm"], ["NANDINI MILK BOOTH", "q90876543@ybl"], ["HARI TAILORS", "hari.tailor@okaxis"]];

    for (let y = 2024; y <= 2026; y++) {
      for (let m = 0; m < 12; m++) {
        if (y === 2026 && m > 8) break;
        const idx = (y - 2024) * 12 + m;
        const t = idx / 32;
        const fyStart = m >= 3 ? y : y - 1;
        const prevMon = MON[(m + 11) % 12];
        const prevYear = m === 0 ? y - 1 : y;

        const salary = fyStart >= 2026 ? 174300 : fyStart >= 2025 ? 158900 : 142500;
        inc(y, m, 1, `NEFT CR-CITI0000002-ACME TECHNOLOGIES PVT LTD-SALARY FOR ${prevMon} ${prevYear}`, salary);
        if (m === 2 && y >= 2025) inc(y, m, 29, `NEFT CR-CITI0000002-ACME TECHNOLOGIES PVT LTD-ANNUAL BONUS FY${String(y).slice(2)}`, y === 2025 ? 120000 : 145000);

        const rent = y === 2024 && m < 5 ? 27000 : (y === 2024 || (y === 2025 && m < 5)) ? 28500 : (y === 2025 || (y === 2026 && m < 5)) ? 30000 : 31500;
        out(y, m, 2, `IMPS-${ref()}-RAMESH GOWDA-HDFC-XXXXXXX8810-RENT ${MON[m]}`, rent);

        const parents = y === 2024 ? 10000 : y === 2025 ? 12000 : 15000;
        out(y, m, 3, upi("LATHA SHARMA", "lathasharma@oksbi", "HOUSEHOLD"), parents);

        const sip = y === 2024 ? 15000 : y === 2025 ? 20000 : 25000;
        out(y, m, 5, `ACH D- INDIAN CLEARING CORP-ZERODHA SIP-${ref()}`, sip);
        if (idx >= 18) out(y, m, 7, `ACH D- BSE STAR MF-PPFAS FLEXI CAP SIP-${ref()}`, 5000);
        if (m === 2) out(y, m, 25, `NEFT DR-SBIN0000813-PPF ACCOUNT DEPOSIT-${ref()}`, 50000);
        if (y === 2025 && m === 3) out(y, m, 10, `FIXED DEPOSIT BOOKED-${ref()}-12 MONTHS`, 100000);
        if (y === 2026 && m === 3) inc(y, m, 10, `FIXED DEPOSIT MATURITY PROCEEDS-${ref()}`, 107100);
        if (idx >= 12 && m % 3 === 0) out(y, m, 12, `ACH D- NPS TRUST-TIER I CONTRIBUTION-${ref()}`, 12500);
        if (y === 2025 && m === 11) inc(y, m, 1, `NEFT CR-HDFC0000060-INDIAN CLEARING CORP-MF REDEMPTION-${ref()}`, 40000);

        const elec = 1250 + (m >= 2 && m <= 4 ? 1500 : 0) + between(-200, 450) + t * 300;
        out(y, m, int(10, 13), `BILLPAY-BESCOM-ELECTRICITY-${ref()}`, Math.round(elec));
        out(y, m, 18, `ACH D- AIRTEL POSTPAID-${ref()}`, y === 2024 ? 799 : 999);
        out(y, m, 8, upi("JIOFIBER", "jiofiber@jio", "BROADBAND"), 1178);
        if (m % 2 === 0) out(y, m, int(14, 20), upi("INDANE GAS", "indane@sbi", "LPG REFILL"), 905 + Math.round(t * 60));

        out(y, m, 14, `ACH D- NETFLIX ENTERTAINMENT SERVICES IND-${ref()}`, idx >= 18 ? 799 : 649);
        out(y, m, 21, `POS ${card} SPOTIFY INDIA`, idx >= 14 ? 139 : 119);
        if (idx >= 28) out(y, m, 9, `POS ${card} GOOGLE YOUTUBE PREMIUM`, 149);
        if (idx >= 20) out(y, m, 4, `ACH D- CULTFIT CUREFIT HEALTHCARE-${ref()}`, 1599);
        if (m === 7) out(y, m, 11, `POS ${card} AMAZON PRIME MEMBERSHIP`, 1499);
        if (idx >= 10 && idx <= 21) out(y, m, 6, `ACH D- BAJAJ FINANCE LTD-EMI ${ref()}`, 4166);
        if (m === 2) out(y, m, 16, `BILLPAY-HDFC ERGO GENERAL INSURANCE-${ref()}`, y === 2024 ? 24800 : y === 2025 ? 26900 : 29500);
        if (m % 3 === 0) out(y, m, 20, `ACH D- LIC OF INDIA-PREMIUM-${ref()}`, 8540);

        out(y, m, 15, `BILLPAY-HDFC BANK CREDIT CARD-AUTOPAY-${ref()}`, amt(9000 + t * 6000, 15000 + t * 9000, 1));

        const groceryN = int(9, 13);
        for (let i = 0; i < groceryN; i++) {
          const g = pick([["BLINKIT", "blinkit.payu@hdfcbank"], ["ZEPTO", "zeptomarketplace@ybl"], ["BIGBASKET", "bigbasket@icici"], ["SWIGGY INSTAMART", "swiggyinstamart@icici"]]);
          out(y, m, int(1, 28), upi(g[0], g[1]), amt(180, 1900 + t * 500));
        }
        out(y, m, int(5, 26), `POS ${card} AVENUE SUPERMARTS DMART`, amt(1800, 4200 + t * 800));

        const foodN = Math.round(7 + t * 11 + between(-2, 3));
        for (let i = 0; i < foodN; i++) {
          const f = pick([["SWIGGY", "swiggy8@ybl"], ["ZOMATO", "zomato-order@paytm"], ["SWIGGY", "swiggy8@ybl"]]);
          out(y, m, int(1, 28), upi(f[0], f[1]), amt(260 + t * 80, 680 + t * 220));
        }
        for (let i = 0, n = int(1, 3); i < n; i++) {
          out(y, m, int(1, 28), `POS ${card} ${pick(["THIRD WAVE COFFEE", "BARBEQUE NATION", "TRUFFLES CAFE", "CHAAYOS", "MEGHANA FOODS BIRYANI"])}`, amt(380, 3200));
        }

        for (let i = 0, n = int(6, 12); i < n; i++) {
          const c = pick([["UBER", "uber.payu@hdfcbank"], ["OLA", "olacabs@icici"], ["RAPIDO", "rapido.payu@hdfcbank"]]);
          out(y, m, int(1, 28), upi(c[0], c[1]), amt(90, 540));
        }
        out(y, m, int(1, 10), upi("BMRCL NAMMA METRO", "bmrcl@axisbank", "CARD RECHARGE"), 500);
        for (let i = 0, n = int(1, 2); i < n; i++) out(y, m, int(1, 28), `POS ${card} HPCL ${pick(["KORAMANGALA", "HSR LAYOUT", "SARJAPUR RD"])}`, amt(1500, 2600, 10));

        for (let i = 0, n = int(2, 5); i < n; i++) {
          const s = pick(["AMAZON PAY INDIA", "FLIPKART INTERNET", "MYNTRA DESIGNS", "DECATHLON SPORTS", "NYKAA FASHION"]);
          out(y, m, int(1, 28), `POS ${card} ${s}`, amt(299, 4200 + t * 1200));
        }
        if (m === 9) {
          out(y, m, int(3, 12), `POS ${card} FLIPKART INTERNET BBD`, amt(8000, 18000));
          out(y, m, int(14, 26), `POS ${card} AMAZON PAY INDIA GREAT INDIAN FESTIVAL`, amt(9000, 22000));
        }
        if (y === 2025 && m === 9) out(y, m, 24, `POS ${card} CROMA INFINITI RETAIL`, 54990);

        for (let i = 0, n = int(0, 2); i < n; i++) out(y, m, int(1, 28), upi("BOOKMYSHOW", "bookmyshow@icici"), amt(350, 1300));
        for (let i = 0, n = int(0, 2); i < n; i++) out(y, m, int(1, 28), `POS ${card} APOLLO PHARMACY`, amt(180, 1400));
        if (y === 2025 && m === 7) out(y, m, 19, `POS ${card} MANIPAL HOSPITALS OLD AIRPORT RD`, 38450);
        if (r() < 0.45) out(y, m, int(1, 28), upi("URBAN COMPANY", "urbancompany@ybl"), amt(499, 1800));

        if (y === 2024 && m === 11) { out(y, m, 4, `POS ${card} INDIGO 6E AIRLINES`, 14200); out(y, m, 6, `POS ${card} MAKEMYTRIP INDIA HOTEL`, 18600); }
        if (y === 2025 && m === 4) { out(y, m, 9, `POS ${card} IRCTC E-TICKETING`, 3480); out(y, m, 10, `POS ${card} MAKEMYTRIP INDIA HOTEL`, 9800); }
        if (y === 2025 && m === 11) { out(y, m, 2, `POS ${card} INDIGO 6E AIRLINES`, 22400); out(y, m, 3, `POS ${card} AIRBNB PAYMENTS`, 26800); }
        if (y === 2026 && m === 3) { out(y, m, 12, `POS ${card} MAKEMYTRIP INDIA FLIGHT`, 16500); }

        const atmN = t < 0.45 ? int(1, 2) : int(0, 1);
        for (let i = 0; i < atmN; i++) out(y, m, int(1, 28), `NWD-${card}-S1ANBG12-BANGALORE`, pick([2000, 3000, 4000, 5000]));

        for (let i = 0, n = int(2, 5); i < n; i++) { const p = pick(people); out(y, m, int(1, 28), upi(p[0], p[1], "SENT USING UPI"), amt(150, 2500, 10)); }
        for (let i = 0, n = int(1, 4); i < n; i++) { const s = pick(shops); out(y, m, int(1, 28), upi(s[0], s[1]), amt(60, 900)); }
        for (let i = 0, n = int(0, 3); i < n; i++) { const p = pick(people); inc(y, m, int(1, 28), upi(p[0], p[1], "SPLIT"), amt(200, 1800, 10)); }

        if (m % 3 === 2) inc(y, m, new Date(y, m + 1, 0).getDate(), `CREDIT INTEREST CAPITALISED`, Math.round(between(900, 2300)));
        if (r() < 0.3) inc(y, m, int(1, 28), `REFUND-${pick(["AMAZON PAY INDIA", "FLIPKART INTERNET", "MYNTRA DESIGNS"])}-${ref()}`, amt(299, 2200));
        if (m === 5 || m === 11) out(y, m, 26, `IMPS-${ref()}-OWN ACCOUNT TRANSFER-ICIC0000104-SELF`, 40000);

        if (y === 2026 && m === 5) {
          const a = 642;
          out(y, m, 13, upi("ZOMATO", "zomato-order@paytm"), a);
          out(y, m, 13, upi("ZOMATO", "zomato-order@paytm"), a);
        }
      }
    }

    tx.sort((p, q) => p.d - q.d || p.o - q.o);
    let bal = 185000;
    const lines = [
      "HDFC BANK Ltd.,,,,,,",
      "Statement of accounts (SAMPLE - synthetic data),,,,,,",
      "MR A SHARMA,,,,,,",
      "Account No :XXXXXXXX4821,,,,,,",
      "Statement From : 01/01/24 To : 30/09/26,,,,,,",
      ",,,,,,",
      "Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance",
      "********,********,********,********,********,********,********",
    ];
    const csvCell = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s);
    for (const e of tx) {
      bal = Math.round((bal + e.a) * 100) / 100;
      const d = `${pad(e.d.getDate())}/${pad(e.d.getMonth() + 1)}/${String(e.d.getFullYear()).slice(2)}`;
      const w = e.a < 0 ? (-e.a).toFixed(2) : "";
      const c = e.a > 0 ? e.a.toFixed(2) : "";
      lines.push([d, csvCell(e.n), "0000" + ref().slice(0, 12), d, w, c, bal.toFixed(2)].join(","));
    }
    lines.push(",,,,,,", "STATEMENT SUMMARY :-,,,,,,");
    return lines.join("\r\n");
  };
})();
