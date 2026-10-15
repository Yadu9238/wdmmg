(function () {
  "use strict";
  const WD = (window.WD = window.WD || {});

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));
  const DAY = 864e5;

  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const parseKey = (k) => { const [y, m] = k.split("-").map(Number); return { y, m: m - 1 }; };
  const addMonths = (k, n) => { const { y, m } = parseKey(k); const d = new Date(y, m + n, 1); return keyOf(d); };
  const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  // ---------- Formatting ----------
  const inrFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  WD.fmt = {
    inr(n, opts = {}) {
      if (n == null || !isFinite(n)) return "—";
      const s = inrFmt.format(Math.round(Math.abs(n)));
      const sign = n < 0 ? "−" : opts.sign && n > 0 ? "+" : "";
      return `${sign}₹${s}`;
    },
    compact(n, opts = {}) {
      if (n == null || !isFinite(n)) return "—";
      const a = Math.abs(n);
      const sign = n < 0 ? "−" : opts.sign && n > 0 ? "+" : "";
      let s;
      if (a >= 1e7) s = `${(a / 1e7).toFixed(a >= 1e8 ? 0 : 2).replace(/\.?0+$/, "")} Cr`;
      else if (a >= 1e5) s = `${(a / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.?0+$/, "")} L`;
      else if (a >= 1e3) s = `${(a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "")}k`;
      else s = String(Math.round(a));
      return `${sign}₹${s}`;
    },
    pct(x, digits = 0) {
      if (x == null || !isFinite(x)) return "—";
      if (x > 0 && x < 0.005 && digits === 0) return "<1%";
      const s = `${(Math.abs(x) * 100).toFixed(digits)}%`;
      return x < 0 && s !== "0%" ? `−${s}` : s;
    },
    monthLong(k) { const { y, m } = parseKey(k); return `${MONTH_NAMES[m]} ${y}`; },
    monthShort(k) { const { y, m } = parseKey(k); return `${MONTH_SHORT[m]} ${String(y).slice(2)}`; },
    monthName(k) { return MONTH_NAMES[parseKey(k).m]; },
    date(d) { return `${String(d.getDate()).padStart(2, "0")} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`; },
    dateShort(d) { return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; },
  };
  WD.MONTH_SHORT = MONTH_SHORT;
  WD.keyOf = keyOf;
  WD.addMonths = addMonths;

  const DAILY_EXCLUDE = new Set(["rent", "emi", "invest", "cc_bill", "insurance", "family", "transfer"]);
  const PRICE_CATS = new Set(["subscriptions", "bills", "rent", "insurance", "emi"]);

  WD.analyze = function (txnsIn) {
    const txns = txnsIn.slice().sort((a, b) => a.date - b.date);
    txns.forEach((t, i) => { t.id = i; t.key = keyOf(t.date); t.kind = WD.CAT[t.cat].kind; });
    if (!txns.length) return null;
    const dataStart = txns[0].date, dataEnd = txns[txns.length - 1].date;
    const months = [];
    for (let k = keyOf(dataStart); k <= keyOf(dataEnd); k = addMonths(k, 1)) months.push(k);

    const hasBalance = txns.filter((t) => t.balance != null).length > txns.length * 0.8;
    const M = {};
    months.forEach((k, i) => {
      M[k] = { key: k, i, income: 0, spend: 0, need: 0, want: 0, invested: 0, transfer: 0, cats: {}, inCats: {}, count: 0, closing: null, minBal: null, minBalDate: null, txns: [] };
    });

    let running = 0;
    for (const t of txns) {
      const mo = M[t.key];
      mo.count++;
      mo.txns.push(t);
      if (t.kind === "income") { mo.income += t.amount; mo.inCats[t.cat] = (mo.inCats[t.cat] || 0) + t.amount; }
      else if (t.kind === "save") mo.invested -= t.amount;
      else if (t.kind === "transfer") mo.transfer -= t.amount;
      else {
        mo.spend -= t.amount;
        mo[t.kind] -= t.amount;
        mo.cats[t.cat] = (mo.cats[t.cat] || 0) - t.amount;
      }
      running += t.amount;
      const bal = hasBalance ? t.balance : running;
      if (bal != null) {
        mo.closing = bal;
        if (mo.minBal == null || bal < mo.minBal) { mo.minBal = bal; mo.minBalDate = t.date; }
      }
    }
    let lastClosing = null;
    months.forEach((k) => {
      const mo = M[k];
      if (mo.closing == null) mo.closing = lastClosing; else lastClosing = mo.closing;
      mo.kept = mo.income - mo.spend;
      mo.net = mo.income - mo.spend - mo.invested;
      mo.rate = mo.income > 0 ? mo.kept / mo.income : null;
      const { y, m } = parseKey(k);
      const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
      mo.partial = null;
      if (k === keyOf(dataEnd) && dataEnd.getDate() < last.getDate() - 1) mo.partial = { to: dataEnd };
      if (k === keyOf(dataStart) && dataStart.getDate() > 3) mo.partial = { ...(mo.partial || {}), from: dataStart };
      mo.first = first; mo.last = last;
    });

    const spendCats = WD.CATEGORIES.filter((c) => c.kind === "need" || c.kind === "want").map((c) => c.id);
    const series = {};
    spendCats.forEach((c) => (series[c] = months.map((k) => M[k].cats[c] || 0)));

    const recurring = detectRecurring(txns, dataEnd);

    return { txns, months, M, series, dataStart, dataEnd, hasBalance, recurring, spendCats };
  };

  function detectRecurring(txns, dataEnd) {
    const groups = {};
    for (const t of txns) {
      if (t.amount >= 0 || t.kind === "transfer" || !t.mkey) continue;
      if (t.cat === "cash") continue;
      (groups[t.mkey] = groups[t.mkey] || []).push(t);
    }
    const out = [];
    for (const key in groups) {
      const g = groups[key];
      if (g.length < 2) continue;
      const monthsSeen = new Set(g.map((t) => t.key));
      if (g.length / monthsSeen.size > 1.35) continue;
      const gaps = [];
      for (let i = 1; i < g.length; i++) gaps.push((g[i].date - g[i - 1].date) / DAY);
      const med = median(gaps);
      let cadence = null, every = 0, perYear = 0;
      if (med >= 25 && med <= 36 && g.length >= 3) { cadence = "Monthly"; every = 30.4; perYear = 12; }
      else if (med >= 55 && med <= 66 && g.length >= 3) { cadence = "Every 2 months"; every = 61; perYear = 6; }
      else if (med >= 84 && med <= 98 && g.length >= 3) { cadence = "Quarterly"; every = 91; perYear = 4; }
      else if (med >= 350 && med <= 380) { cadence = "Yearly"; every = 365; perYear = 1; }
      if (!cadence) continue;
      const regular = gaps.filter((x) => Math.abs(x - med) <= Math.max(6, med * 0.25)).length / gaps.length;
      if (regular < 0.7) continue;
      const amts = g.map((t) => -t.amount);
      const recent = amts.slice(-6);
      const cv = Math.sqrt(mean(recent.map((a) => (a - mean(recent)) ** 2))) / mean(recent);
      if (cv > (perYear === 1 ? 0.12 : 0.4)) continue;
      const latest = amts[amts.length - 1];
      let change = null;
      if (cv < 0.12) {
        for (let i = amts.length - 1; i > 0; i--) {
          if (Math.abs(amts[i] - amts[i - 1]) / amts[i - 1] > 0.02 && amts.slice(i).every((a) => Math.abs(a - amts[i]) / amts[i] < 0.02)) {
            change = { from: amts[i - 1], to: amts[i], date: g[i].date };
            break;
          }
        }
      }
      const last = g[g.length - 1].date;
      const active = (dataEnd - last) / DAY <= every * 1.6;
      const t0 = g[g.length - 1];
      out.push({
        key, name: t0.merchant, cat: t0.cat, cadence, every, perYear, latest,
        typical: cv < 0.12 ? latest : mean(recent), variable: cv >= 0.12,
        first: g[0].date, last, next: new Date(+last + every * DAY), active, change,
        annual: (cv < 0.12 ? latest : mean(recent)) * perYear, count: g.length, txns: g,
      });
    }
    out.sort((a, b) => b.annual - a.annual);
    return out;
  }

  // ---------- Period helpers ----------
  WD.yearOf = (k, mode) => { const { y, m } = parseKey(k); return mode === "fy" ? (m >= 3 ? y : y - 1) : y; };
  WD.yearLabel = (y, mode) => (mode === "fy" ? `FY ${y}–${String(y + 1).slice(2)}` : String(y));
  WD.yearMonths = (y, mode) => {
    const ks = [];
    for (let i = 0; i < 12; i++) ks.push(keyOf(new Date(y, (mode === "fy" ? 3 : 0) + i, 1)));
    return ks;
  };

  WD.years = function (A, mode) {
    const ys = {};
    for (const k of A.months) {
      const y = WD.yearOf(k, mode);
      const mo = A.M[k];
      const r = (ys[y] = ys[y] || { y, label: WD.yearLabel(y, mode), months: 0, partialMonths: 0, income: 0, spend: 0, invested: 0, need: 0, want: 0, cats: {} });
      r.months++;
      if (mo.partial) r.partialMonths++;
      r.income += mo.income; r.spend += mo.spend; r.invested += mo.invested; r.need += mo.need; r.want += mo.want;
      for (const c in mo.cats) r.cats[c] = (r.cats[c] || 0) + mo.cats[c];
    }
    return Object.values(ys).sort((a, b) => a.y - b.y).map((r) => {
      r.kept = r.income - r.spend;
      r.rate = r.income > 0 ? r.kept / r.income : null;
      r.avgSpend = r.spend / r.months;
      r.top = Object.entries(r.cats).sort((a, b) => b[1] - a[1])[0];
      return r;
    });
  };

  WD.cumulative = function (A, k, mode) {
    const y = WD.yearOf(k, mode);
    const lines = [];
    for (let yy = y; yy >= y - 2; yy--) {
      const ks = WD.yearMonths(yy, mode);
      let c = 0;
      const pts = ks.map((kk, idx) => {
        const mo = A.M[kk];
        if (!mo || (yy === y && kk > k)) return null;
        c += mo.spend;
        return { idx, key: kk, value: c };
      });
      if (pts.some(Boolean)) lines.push({ y: yy, label: WD.yearLabel(yy, mode), pts, current: yy === y });
    }
    return lines;
  };

  WD.windowStats = function (A, k, n) {
    const i = A.months.indexOf(k);
    const ks = A.months.slice(Math.max(0, i - n + 1), i + 1);
    return { keys: ks, income: sum(ks.map((x) => A.M[x].income)), spend: sum(ks.map((x) => A.M[x].spend)), need: sum(ks.map((x) => A.M[x].need)) };
  };

  WD.runway = function (A, k) {
    const mo = A.M[k];
    const w = WD.windowStats(A, k, 6);
    const essentials = w.keys.length ? w.need / w.keys.length : 0;
    return { balance: mo.closing, essentials, months: essentials > 0 && mo.closing != null ? mo.closing / essentials : null };
  };

  WD.daily = function (A, k) {
    const mo = A.M[k];
    const end = mo.partial && mo.partial.to ? mo.partial.to : mo.last;
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    const days = new Map();
    for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) days.set(+d, { date: d, value: 0, top: null });
    for (const t of A.txns) {
      if (t.amount >= 0 || t.date < start || t.date > end) continue;
      if (DAILY_EXCLUDE.has(t.cat) || t.kind === "income" || t.kind === "save") continue;
      const cell = days.get(+t.date);
      if (!cell) continue;
      cell.value -= t.amount;
      if (!cell.top || -t.amount > -cell.top.amount) cell.top = t;
    }
    const cells = [...days.values()].filter((c) => c.date >= A.dataStart);
    const wd = [0, 0, 0, 0, 0, 0, 0], wn = [0, 0, 0, 0, 0, 0, 0];
    cells.forEach((c) => { const d = (c.date.getDay() + 6) % 7; wd[d] += c.value; wn[d]++; });
    const weekday = wd.map((v, i) => (wn[i] ? v / wn[i] : 0));
    return { start, end, cells, weekday };
  };

  WD.channels = function (A, keys) {
    const set = new Set(keys);
    const ch = {};
    for (const t of A.txns) {
      if (!set.has(t.key) || t.amount >= 0 || t.kind === "transfer") continue;
      const c = (ch[t.channel] = ch[t.channel] || { name: t.channel, amount: 0, count: 0 });
      c.amount -= t.amount; c.count++;
    }
    const list = Object.values(ch).sort((a, b) => b.amount - a.amount);
    const total = sum(list.map((c) => c.amount));
    list.forEach((c) => { c.share = total ? c.amount / total : 0; c.avg = c.amount / c.count; });
    return { list, total };
  };

  // ---------- Insights ----------
  WD.insights = function (A, k) {
    const out = [];
    const i = A.months.indexOf(k);
    const mo = A.M[k];
    const prev = i > 0 ? A.M[A.months[i - 1]] : null;
    const ly = A.M[addMonths(k, -12)];
    const cat = (c) => WD.CAT[c].label;

    // Spikes vs trailing 6-month average
    if (i >= 3) {
      const spikes = [];
      for (const c of A.spendCats) {
        const s = A.series[c];
        const hist = s.slice(Math.max(0, i - 6), i);
        const avg = mean(hist);
        const cur = s[i];
        if (cur - avg > 3000 && cur > avg * 1.4) spikes.push({ c, cur, avg, diff: cur - avg });
      }
      spikes.sort((a, b) => b.diff - a.diff).slice(0, 2).forEach((s) => {
        const big = mo.txns.filter((t) => t.cat === s.c && t.amount < 0).sort((a, b) => a.amount - b.amount)[0];
        const ratio = s.avg > 0 ? s.cur / s.avg : Infinity;
        out.push({
          type: "spike", weight: 90 + s.diff / 1000, cat: s.c, tone: "bad",
          fig: WD.fmt.inr(s.cur), figNote: ratio > 4 ? "far above usual" : `${ratio.toFixed(1)}× usual`,
          title: ratio > 4 ? `${cat(s.c)} was far above its usual level` : `${cat(s.c)} ran ${ratio.toFixed(1)}× its usual level`,
          detail: `${WD.fmt.inr(s.cur)} against a 6-month average of ${WD.fmt.inr(s.avg)}.${big ? ` Largest: ${big.merchant}, ${WD.fmt.inr(-big.amount)} on ${WD.fmt.dateShort(big.date)}.` : ""}`,
        });
      });
    }

    // Lifestyle inflation: trailing 12 months vs the 12 before
    if (i >= 23) {
      const cur = WD.windowStats(A, k, 12), past = WD.windowStats(A, addMonths(k, -12), 12);
      const sg = cur.spend / past.spend - 1, ig = cur.income / past.income - 1;
      if (isFinite(sg) && isFinite(ig)) {
        const creeping = sg > ig + 0.02;
        out.push({
          type: creeping ? "inflation" : "steady", weight: creeping ? 80 : 30, tone: creeping ? "bad" : "good",
          fig: `${sg >= 0 ? "+" : "−"}${WD.fmt.pct(Math.abs(sg), 1)}`, figNote: `spending, 12 months`,
          title: creeping ? `Spending is growing faster than income` : `Income is outpacing spending`,
          detail: `Over the last 12 months spending ${sg >= 0 ? "rose" : "fell"} ${WD.fmt.pct(Math.abs(sg), 1)} while income ${ig >= 0 ? "rose" : "fell"} ${WD.fmt.pct(Math.abs(ig), 1)}, compared with the 12 months before.`,
        });
      }
    }

    // New recurring payments and price changes
    const winStart = new Date(mo.last.getFullYear(), mo.last.getMonth() - 5, 1);
    A.recurring.forEach((r) => {
      if (r.first >= winStart && r.first <= mo.last && r.active) {
        out.push({ type: "new", weight: 70, mkey: r.key, tone: "info", fig: WD.fmt.inr(r.annual), figNote: "a year", title: `New recurring payment: ${r.name}`, detail: `${WD.fmt.inr(r.typical)} ${r.cadence.toLowerCase()} since ${WD.fmt.date(r.first)}.` });
      }
      if (r.change && PRICE_CATS.has(r.cat) && r.change.date <= mo.last && r.change.date >= new Date(mo.last.getFullYear() - 1, mo.last.getMonth(), 1) && r.change.to > r.change.from) {
        const who = r.cat === "rent" ? "Rent" : r.name;
        out.push({ type: "price", weight: r.cat === "subscriptions" ? 68 : 60, mkey: r.key, tone: "bad", fig: `+${WD.fmt.inr((r.change.to - r.change.from) * r.perYear)}`, figNote: "more a year", title: `${who} went up ${WD.fmt.pct(r.change.to / r.change.from - 1)}`, detail: `${r.cat === "rent" ? `Paid to ${r.name}, from` : "From"} ${WD.fmt.inr(r.change.from)} to ${WD.fmt.inr(r.change.to)} ${r.cadence.toLowerCase()} since ${WD.fmt.date(r.change.date)}.` });
      }
    });

    // Food delivery habit
    const food = mo.txns.filter((t) => t.cat === "food" && t.amount < 0);
    if (ly && food.length >= 4) {
      const lyFood = ly.txns.filter((t) => t.cat === "food" && t.amount < 0);
      if (lyFood.length && food.length > lyFood.length * 1.2) {
        out.push({ type: "habit", weight: 55, cat: "food", tone: "info", fig: `${food.length}`, figNote: `orders, was ${lyFood.length}`, title: `More food orders than a year ago`, detail: `Average order ${WD.fmt.inr(mean(food.map((t) => -t.amount)))}, was ${WD.fmt.inr(mean(lyFood.map((t) => -t.amount)))}. Together: ${WD.fmt.inr(-sum(food.map((t) => t.amount)))} this month.` });
      }
    }

    // Possible duplicate charges
    const debits = mo.txns.filter((t) => t.amount < 0 && t.kind !== "transfer" && t.kind !== "save");
    for (let a = 0; a < debits.length; a++) {
      for (let b = a + 1; b < debits.length; b++) {
        const x = debits[a], y = debits[b];
        if (x.mkey === y.mkey && x.amount === y.amount && Math.abs(y.date - x.date) <= DAY && -x.amount >= 200) {
          out.push({ type: "duplicate", weight: 85, ids: [x.id, y.id], tone: "bad", fig: `${WD.fmt.inr(-x.amount)} ×2`, figNote: "same day", title: `Possible double charge at ${x.merchant}`, detail: `Two payments of ${WD.fmt.inr(-x.amount)} on ${WD.fmt.dateShort(x.date)}${+x.date !== +y.date ? " and " + WD.fmt.dateShort(y.date) : ""}. Worth checking for a refund.` });
          a = debits.length; break;
        }
      }
    }

    // Overspend / low balance
    if (mo.kept < 0) {
      out.push({ type: "overspend", weight: 95, tone: "bad", fig: `−${WD.fmt.inr(-mo.kept)}`, figNote: "more out than in", title: `You spent more than came in`, detail: `The gap was covered from your balance${mo.closing != null ? `, which closed at ${WD.fmt.inr(mo.closing)}` : ""}.` });
    }
    const run = WD.runway(A, k);
    if (mo.minBal != null && run.essentials > 0 && mo.minBal < run.essentials) {
      out.push({ type: "low", weight: 75, tone: "bad", fig: WD.fmt.inr(mo.minBal), figNote: "lowest balance", title: `Balance dipped below a month of essentials`, detail: `On ${WD.fmt.dateShort(mo.minBalDate)}; essentials average ${WD.fmt.inr(run.essentials)} a month.` });
    }

    // Biggest mover vs last month, if nothing louder
    if (prev) {
      const movers = A.spendCats.map((c) => ({ c, d: (mo.cats[c] || 0) - (prev.cats[c] || 0) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
      const top = movers[0];
      if (top && Math.abs(top.d) > 1500 && !out.some((o) => o.cat === top.c)) {
        out.push({ type: top.d > 0 ? "up" : "down", weight: 40, cat: top.c, tone: top.d > 0 ? "bad" : "good", fig: `${top.d > 0 ? "+" : "−"}${WD.fmt.inr(Math.abs(top.d))}`, figNote: `vs ${WD.fmt.monthName(prev.key)}`, title: `${cat(top.c)} ${top.d > 0 ? "up" : "down"} on ${WD.fmt.monthName(prev.key)}`, detail: `${WD.fmt.inr(mo.cats[top.c] || 0)} this month against ${WD.fmt.inr(prev.cats[top.c] || 0)}.` });
      }
    }

    return out.sort((a, b) => b.weight - a.weight).slice(0, 6);
  };

  // Combine several months into one month-shaped record (for YTD / full-year views).
  WD.aggregate = function (A, keys) {
    const r = { keys, income: 0, spend: 0, need: 0, want: 0, invested: 0, cats: {}, inCats: {}, txns: [], count: 0, partial: false };
    for (const k of keys) {
      const mo = A.M[k];
      if (!mo) continue;
      r.income += mo.income; r.spend += mo.spend; r.need += mo.need; r.want += mo.want; r.invested += mo.invested;
      for (const c in mo.cats) r.cats[c] = (r.cats[c] || 0) + mo.cats[c];
      for (const c in mo.inCats) r.inCats[c] = (r.inCats[c] || 0) + mo.inCats[c];
      r.txns.push(...mo.txns);
      r.count += mo.count;
      if (mo.partial) r.partial = true;
    }
    r.kept = r.income - r.spend;
    r.rate = r.income > 0 ? r.kept / r.income : null;
    return r;
  };

  // ---------- Investments ----------
  const INSTRUMENTS = [
    { id: "ppf", label: "PPF", re: /\bPPF\b/i, color: "oklch(0.76 0.08 150)" },
    { id: "nps", label: "NPS", re: /\bNPS\b|NPS TRUST/i, color: "oklch(0.64 0.08 120)" },
    { id: "deposit", label: "Fixed & recurring deposits", re: /FIXED DEPOSIT|\bFD\b|RECURRING DEP|\bRD\b/i, color: "oklch(0.7 0.06 215)" },
    { id: "mf", label: "Mutual funds", re: /\bSIP\b|MUTUAL|\bMF\b|BSE STAR|\bCAMS\b|KFIN|\bICCL\b|INDIAN CLEARING|\bCOIN\b/i, color: "oklch(0.58 0.12 168)" },
    { id: "stocks", label: "Stocks & brokers", re: /ZERODHA|GROWW|UPSTOX|NSE CLEARING|SMALLCASE|PAYTM MONEY|ANGEL ONE|\bDHAN\b/i, color: "oklch(0.42 0.08 180)" },
    { id: "other", label: "Other investments", re: /.*/, color: "oklch(0.8 0.02 165)" },
  ];
  WD.INSTRUMENTS = INSTRUMENTS;
  const instrumentOf = (t) => INSTRUMENTS.find((x) => x.re.test(t.narration)).id;

  WD.investments = function (A) {
    const inv = A.txns.filter((t) => t.kind === "save");
    const monthly = A.months.map((k) => ({ key: k, out: 0, back: 0, by: {} }));
    const mi = Object.fromEntries(A.months.map((k, i) => [k, i]));
    const groups = {};
    let out = 0, back = 0;
    const byInst = {};
    for (const t of inv) {
      const inst = instrumentOf(t);
      const m = monthly[mi[t.key]];
      if (t.amount < 0) {
        const a = -t.amount;
        out += a; m.out += a; m.by[inst] = (m.by[inst] || 0) + a;
        byInst[inst] = (byInst[inst] || 0) + a;
        const g = (groups[t.mkey] = groups[t.mkey] || { key: t.mkey, name: t.merchant, inst, txns: [], months: new Set(), total: 0 });
        g.txns.push(t); g.months.add(t.key); g.total += a;
      } else { back += t.amount; m.back += t.amount; }
    }
    const end = A.dataEnd;
    const last12 = A.months.slice(-12), prev12 = A.months.slice(-24, -12);
    const sumOut = (ks) => sum(ks.map((k) => monthly[mi[k]].out));
    const sumIn = (ks) => sum(ks.map((k) => A.M[k].income));
    const rec = Object.fromEntries(A.recurring.map((r) => [r.key, r]));
    const dests = Object.values(groups).map((g) => {
      const r = rec[g.key];
      const first = g.txns[0].date, last = g.txns[g.txns.length - 1].date;
      let consistency = null;
      if (r && r.cadence === "Monthly") {
        let expected = 0;
        for (let k = keyOf(first); k <= keyOf(r.active ? end : last); k = addMonths(k, 1)) expected++;
        if (r.active && A.M[keyOf(end)] && A.M[keyOf(end)].partial && !g.months.has(keyOf(end))) expected--;
        consistency = { paid: g.months.size, expected };
      }
      return {
        ...g, first, last, latest: -g.txns[g.txns.length - 1].amount, recurring: r || null,
        cadence: r ? r.cadence : g.txns.length === 1 ? "One-off" : "Irregular",
        active: r ? r.active : (end - last) / DAY < 45, change: r ? r.change : null,
        last12: sum(g.txns.filter((t) => last12.includes(t.key)).map((t) => -t.amount)), consistency,
        monthlyEq: r && r.active ? r.annual / 12 : 0,
      };
    }).sort((a, b) => b.last12 - a.last12 || b.total - a.total);
    return {
      monthly, out, back, net: out - back, byInst, dests,
      income: sum(A.months.map((k) => A.M[k].income)),
      last12: { out: sumOut(last12), income: sumIn(last12), n: last12.length },
      prev12: prev12.length === 12 ? { out: sumOut(prev12), income: sumIn(prev12) } : null,
      monthsWith: monthly.filter((m) => m.out > 0).length,
      commitment: sum(dests.map((d) => d.monthlyEq)),
    };
  };

  WD.parseKey = parseKey;
  WD.mean = mean;
  WD.sum = sum;
})();
