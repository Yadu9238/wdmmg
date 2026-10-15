(function () {
  "use strict";
  const WD = (window.WD = window.WD || {});

  // kind: income | need | want | save | transfer
  const CATEGORIES = [
    { id: "salary", label: "Salary", kind: "income" },
    { id: "interest", label: "Interest & dividends", kind: "income" },
    { id: "refund", label: "Refunds & cashback", kind: "income" },
    { id: "other_in", label: "Other money in", kind: "income" },
    { id: "rent", label: "Rent & housing", kind: "need" },
    { id: "groceries", label: "Groceries", kind: "need" },
    { id: "bills", label: "Bills & utilities", kind: "need" },
    { id: "emi", label: "Loans & EMIs", kind: "need" },
    { id: "insurance", label: "Insurance", kind: "need" },
    { id: "health", label: "Health", kind: "need" },
    { id: "transport", label: "Transport & fuel", kind: "need" },
    { id: "education", label: "Education", kind: "need" },
    { id: "family", label: "Family support", kind: "need" },
    { id: "food", label: "Food delivery & dining", kind: "want" },
    { id: "shopping", label: "Shopping", kind: "want" },
    { id: "subscriptions", label: "Subscriptions", kind: "want" },
    { id: "entertainment", label: "Entertainment", kind: "want" },
    { id: "travel", label: "Travel", kind: "want" },
    { id: "personal", label: "Personal care", kind: "want" },
    { id: "cash", label: "Cash withdrawals", kind: "want" },
    { id: "cc_bill", label: "Credit card bill", kind: "want" },
    { id: "upi_other", label: "Other UPI payments", kind: "want" },
    { id: "other", label: "Other spending", kind: "want" },
    { id: "invest", label: "Investments", kind: "save" },
    { id: "transfer", label: "Own-account transfers", kind: "transfer" },
  ];

  const HUES = {
    rent: 250, groceries: 140, bills: 205, emi: 285, insurance: 230, health: 170,
    transport: 95, education: 300, family: 330, food: 35, shopping: 15, subscriptions: 315,
    entertainment: 345, travel: 190, personal: 60, cash: 75, cc_bill: 265, upi_other: 120, other: 110,
    salary: 165, interest: 180, refund: 150, other_in: 195, invest: 160, transfer: 0,
  };
  CATEGORIES.forEach((c) => {
    const h = HUES[c.id] ?? 0;
    c.color = c.kind === "transfer" ? "oklch(0.72 0.01 160)" : `oklch(0.68 0.1 ${h})`;
  });

  WD.CATEGORIES = CATEGORIES;
  WD.CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  WD.KIND_LABEL = { need: "Needs", want: "Wants", save: "Invested", income: "Income", transfer: "Transfer" };

  const R = (re, cat, dir = "any") => ({ re, cat, dir });
  // Order matters: the first match wins.
  const RULES = [
    R(/\bSELF\b|OWN A\/?C|OWN ACCOUNT|SWEEP|TRF TO SELF|SELF TRANSFER/i, "transfer"),
    R(/SALARY|SAL CR|\bSAL\b|PAYROLL|\bBONUS\b/i, "salary", "in"),
    R(/INT\.?\s?PD|INTEREST|\bINT CR|DIVIDEND|\bDIV\b/i, "interest", "in"),
    R(/REFUND|REVERSAL|CASHBACK|CHARGEBACK|\bRFND\b/i, "refund", "in"),
    R(/ZERODHA|GROWW|KUVERA|INDIAN CLEARING|\bICCL\b|BSE STAR|NSE CLEARING|MUTUAL FUND|\bMF\b|\bSIP\b|\bNPS\b|\bPPF\b|UPSTOX|PAYTM MONEY|SMALLCASE|ET MONEY|\bCAMS\b|KFIN|RECURRING DEP|FIXED DEPOSIT|\bFD\b/i, "invest"),
    R(/CREDIT CARD|CC PAYMENT|CCPAY|CARD BILL|\bCRED\b|CARD DUES/i, "cc_bill", "out"),
    R(/\bRENT\b|NOBROKER|NO BROKER|HOUSING\.COM|SOCIETY MAINT|MAINTENANCE|APARTMENT ASSOC/i, "rent", "out"),
    R(/\bEMI\b|\bLOAN\b|BAJAJ FIN|HDFC LTD|LIC HFL|\bNBFC\b|SIMPL|LAZYPAY|ZESTMONEY/i, "emi", "out"),
    R(/NETFLIX|SPOTIFY|HOTSTAR|DISNEY|PRIME VIDEO|AMAZON PRIME|PRIME MEMBERSHIP|YOUTUBE|GOOGLE ONE|GOOGLE ?PLAY|APPLE\.COM|ITUNES|SONYLIV|ZEE5|JIOCINEMA|AUDIBLE|LINKEDIN|NOTION|OPENAI|CHATGPT|ADOBE|MICROSOFT|CULT\.?FIT|CUREFIT|SWIGGY ONE|ZOMATO GOLD/i, "subscriptions", "out"),
    R(/INSURANCE|\bLIC\b|LIC OF INDIA|PREMIUM|HDFC ERGO|HDFC LIFE|ICICI PRU|ICICI LOMBARD|STAR HEALTH|NIVA BUPA|\bACKO\b|MAX LIFE|TATA AIA|SBI LIFE|POLICYBAZAAR/i, "insurance", "out"),
    R(/BIGBASKET|\bBBNOW\b|BLINKIT|GROFERS|ZEPTO|INSTAMART|\bDMART\b|AVENUE SUPER|JIOMART|MORE RETAIL|RELIANCE FRESH|RELIANCE SMART|SPENCER|NATURES BASKET|SUPERMARKET|KIRANA|MILKBASKET|COUNTRY DELIGHT|FRESHTOHOME|LICIOUS|METRO CASH|PROVISION/i, "groceries", "out"),
    R(/SWIGGY|ZOMATO|EATCLUB|\bBOX8\b|FAASOS|DOMINO|MCDONALD|\bKFC\b|PIZZA|STARBUCKS|\bCAFE\b|COFFEE|RESTAURANT|BIRYANI|CHAAYOS|BARBEQUE|HALDIRAM|BAKERY/i, "food", "out"),
    R(/BESCOM|KSEB|MSEDCL|TATA POWER|ADANI ELEC|\bBSES\b|TNEB|TANGEDCO|\bCESC\b|ELECTRICITY|WATER BOARD|BWSSB|PIPED GAS|\bIGL\b|\bMGL\b|INDANE|HP GAS|BHARAT GAS|AIRTEL|\bJIO\b|JIOFIBER|VODAFONE|\bVI\b|BSNL|ACT FIBERNET|HATHWAY|TATA PLAY|\bDTH\b|BROADBAND|POSTPAID|MOBILE RECHARGE/i, "bills", "out"),
    R(/APOLLO|PHARM|MEDPLUS|\b1MG\b|NETMEDS|HOSPITAL|CLINIC|DIAGNOSTIC|DENTAL|PRACTO|THYROCARE|MEDICAL/i, "health", "out"),
    R(/MAKEMYTRIP|\bMMT\b|GOIBIBO|CLEARTRIP|YATRA|IXIGO|INDIGO|AIR INDIA|VISTARA|AKASA|SPICEJET|AIRASIA|\bOYO\b|AIRBNB|TREEBO|HOTEL|RESORT|BOOKING\.COM|AGODA|THOMAS COOK/i, "travel", "out"),
    R(/\bUBER\b|\bOLA\b|OLACABS|RAPIDO|NAMMA YATRI|BLUSMART|\bMETRO\b|BMRCL|DMRC|IRCTC|REDBUS|ABHIBUS|FASTAG|\bNETC\b|\bTOLL\b|PARKING|\bHPCL\b|\bBPCL\b|\bIOCL\b|INDIAN OIL|BHARAT PETROLEUM|HINDUSTAN PETROLEUM|\bSHELL\b|NAYARA|PETROL|\bFUEL\b|FILLING STATION/i, "transport", "out"),
    R(/BOOKMYSHOW|\bPVR\b|\bINOX\b|CINEPOLIS|PAYTM INSIDER|STEAM|PLAYSTATION|DREAM11|CONCERT/i, "entertainment", "out"),
    R(/AMAZON|\bAMZN\b|FLIPKART|MYNTRA|\bAJIO\b|NYKAA|MEESHO|TATA CLIQ|CROMA|RELIANCE DIGITAL|\bIKEA\b|DECATHLON|LIFESTYLE|WESTSIDE|PANTALOONS|\bH&M\b|\bZARA\b|UNIQLO|LENSKART|PEPPERFRY|URBAN LADDER|SHOPPERS STOP/i, "shopping", "out"),
    R(/URBAN ?COMPANY|URBANCLAP|SALON|\bSPA\b|PARLOUR|NATURALS|LAKME|BARBER/i, "personal", "out"),
    R(/\bSCHOOL\b|COLLEGE|UNIVERSITY|TUITION|COURSERA|UDEMY|BYJU|UNACADEMY|UPGRAD|EXAM FEE/i, "education", "out"),
    R(/\bATM\b|\bNWD\b|\bATW\b|CASH WDL|CASH WITHDRAWAL|\bCWDR\b/i, "cash", "out"),
  ];

  const IFSC = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
  const PREFIX = /^(POS|ECOM|ACH\s?[DC]?|NACH|NEFT\s?(CR|DR)?|IMPS|RTGS|BIL|BILLPAY|BBPS|ONL|INB|MB|IB|TO TRANSFER|BY TRANSFER|CHQ|CLG|ME DC SI|SI)\b[\s\-\/:]*/i;

  function titleCase(s) {
    return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Upi|Emi|Lic|Atm|Sip|Hdfc|Icici|Sbi|Ppf|Fd|Mf|Bse|Nse|Nps|Hpcl|Bpcl|Iocl|Bescom|Irctc|Pvr|Kfc|Dmart|Bmrcl)\b/g, (m) => m.toUpperCase());
  }

  function merchantOf(narration) {
    const s = String(narration || "").toUpperCase().replace(/\s+/g, " ").trim();
    if (/\bATM\b|\bNWD\b|\bATW\b|CASH WDL|CASH WITHDRAWAL/.test(s)) return "ATM cash";
    const upi = s.match(/UPI[\/\-](?:(?:DR|CR|P2M|P2A|P2P)[\/\-])?(?:\d{6,}[\/\-])?([^\/@\-]{2,40})/);
    let m;
    if (upi) m = upi[1];
    else if (/^(NEFT|IMPS|RTGS)/.test(s)) {
      const seg = s.replace(PREFIX, "").split(/[-\/]/).map((x) => x.trim())
        .find((x) => /^[A-Z][A-Z .&']{2,}$/.test(x) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(x));
      m = seg || s;
    } else {
      let t = s;
      for (let i = 0; i < 3; i++) t = t.replace(PREFIX, "");
      t = t.replace(IFSC, " ").replace(/\b[0-9X*]{6,}\b/g, " ").replace(/\b\d+\b/g, " ");
      t = t.replace(/[^A-Z&.' ]+/g, " ").replace(/\s+/g, " ").trim();
      m = t;
    }
    m = String(m).replace(/\b(PVT|PRIVATE|LTD|LIMITED|LLP)\b\.?/g, " ").replace(/\s+/g, " ").trim();
    m = m.split(" ").filter((w) => w.length > 1 || w === "&").slice(0, 3).join(" ");
    return titleCase(m || "Unknown");
  }

  function merchantKey(merchant) {
    return merchant.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).join(" ");
  }

  function channelOf(narration) {
    const s = String(narration || "").toUpperCase();
    if (/\bATM\b|\bNWD\b|\bATW\b|CASH WDL|CASH WITHDRAWAL/.test(s)) return "ATM cash";
    if (/UPI/.test(s)) return "UPI";
    if (/\bACH\b|NACH|\bECS\b|MANDATE|AUTOPAY|\bSI\b|STANDING INSTR|BILLPAY|BBPS/.test(s)) return "Auto-debit";
    if (/\bPOS\b|ECOM|\bCARD\b|VISA|MASTERCARD|RUPAY|\bVPS\b|\bIPS\b/.test(s)) return "Card";
    if (/NEFT|RTGS|IMPS|\bFT\b|TRANSFER|\bTRF\b/.test(s)) return "Bank transfer";
    if (/CHQ|CHEQUE|\bCLG\b|CLEARING/.test(s)) return "Cheque";
    return "Other";
  }

  const RULES_KEY = "wdmmg.rules.v1";
  WD.loadOverrides = function () {
    try { return JSON.parse(localStorage.getItem(RULES_KEY) || "{}"); } catch (e) { return {}; }
  };
  WD.saveOverrides = function (o) {
    try { localStorage.setItem(RULES_KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ }
  };

  function ruleCategory(narration, amount) {
    const dir = amount < 0 ? "out" : "in";
    for (const r of RULES) {
      if (r.dir !== "any" && r.dir !== dir) continue;
      if (r.re.test(narration)) {
        if (dir === "in" && WD.CAT[r.cat].kind !== "income" && r.cat !== "transfer" && r.cat !== "invest") continue;
        return { cat: r.cat, how: "rule" };
      }
    }
    if (dir === "in") return { cat: "other_in", how: "fallback" };
    if (/UPI/i.test(narration)) return { cat: "upi_other", how: "fallback" };
    return { cat: "other", how: "fallback" };
  }

  WD.categorize = function (txns, overrides) {
    overrides = overrides || WD.loadOverrides();
    for (const t of txns) {
      t.merchant = merchantOf(t.narration);
      t.mkey = merchantKey(t.merchant);
      t.channel = channelOf(t.narration);
      const dirKey = (t.amount < 0 ? "out:" : "in:") + t.mkey;
      if (overrides[dirKey] && WD.CAT[overrides[dirKey]]) {
        t.cat = overrides[dirKey];
        t.how = "yours";
      } else {
        const r = ruleCategory(t.narration, t.amount);
        t.cat = r.cat;
        t.how = r.how;
      }
    }
    return txns;
  };

  WD.overrideKey = (t) => (t.amount < 0 ? "out:" : "in:") + t.mkey;
  WD.merchantOf = merchantOf;
  WD.channelOf = channelOf;
})();
