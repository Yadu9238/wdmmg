(function () {
  "use strict";
  const WD = window.WD;
  const F = WD.fmt;
  const esc = WD.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = (id, cls = "") => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const STORE_KEY = "wdmmg.data.v1";

  const S = {
    txns: [], A: null, source: "sample", meta: null, sel: null, range: 24, yearMode: "cal", scope: "month",
    led: { q: "", cat: "", dir: "", scope: "month", limit: 60, mkey: null, ids: null, keys: null, label: "" },
    pending: [], showStopped: false,
  };

  // ---------- Loading ----------
  function loadTxns(txns, source, meta) {
    S.txns = txns; S.source = source; S.meta = meta;
    WD.categorize(S.txns);
    S.A = WD.analyze(S.txns);
    if (!S.A) { toast("No transactions found in those files."); return; }
    const ms = S.A.months;
    let sel = ms[ms.length - 1];
    if (S.A.M[sel].partial && S.A.M[sel].partial.to && ms.length > 1) sel = ms[ms.length - 2];
    S.sel = sel;
    S.led = { ...S.led, q: "", cat: "", dir: "", scope: "month", limit: 60, mkey: null, ids: null, keys: null, label: "" };
    $("#ledQ").value = "";
    renderAll();
  }

  function reanalyse() {
    WD.categorize(S.txns);
    S.A = WD.analyze(S.txns);
    renderAll();
  }

  function sampleTxns() {
    const rows = WD.parseCSV(WD.buildSampleCSV());
    const a = WD.analyseRows(rows);
    return WD.extract(a.rows, a.headerRow, a.map).txns;
  }

  function loadSample() {
    const tx = sampleTxns();
    loadTxns(tx, "sample", { files: [{ name: "sample-hdfc-statement.csv", bank: "HDFC Bank", count: tx.length }] });
  }

  function saveStored() {
    try {
      const data = S.txns.map((t) => [WD.keyOf(t.date) + "-" + String(t.date.getDate()).padStart(2, "0"), t.narration, t.amount, t.balance]);
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, meta: S.meta, data }));
      return true;
    } catch (e) {
      toast("Couldn't save on this device (browser storage is full or blocked). The analysis still works for this visit.");
      return false;
    }
  }
  function loadStored() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const o = JSON.parse(raw);
      const tx = o.data.map(([d, n, a, b]) => { const [y, m, dd] = d.split("-").map(Number); return { date: new Date(y, m - 1, dd), narration: n, amount: a, balance: b }; });
      if (!tx.length) return false;
      loadTxns(tx, "stored", o.meta);
      return true;
    } catch (e) { return false; }
  }

  // ---------- Helpers ----------
  const monthIdx = () => S.A.months.indexOf(S.sel);
  const prevKey = () => S.A.months[monthIdx() - 1] || null;
  const lyKey = () => (S.A.M[WD.addMonths(S.sel, -12)] ? WD.addMonths(S.sel, -12) : null);

  function visibleKeys() {
    const ms = S.A.months, n = S.range || ms.length;
    let end = ms.length - 1, start = Math.max(0, end - n + 1);
    const si = monthIdx();
    if (si < start) { start = si; end = Math.min(ms.length - 1, start + n - 1); }
    return ms.slice(start, end + 1);
  }

  function delta(cur, base, goodUp, kind = "pct") {
    if (base == null || cur == null || !isFinite(base) || !isFinite(cur)) return `<span class="delta is-na">—</span>`;
    let v, txt;
    if (kind === "pts") { v = (cur - base) * 100; txt = `${Math.abs(v).toFixed(1)} pts`; }
    else {
      if (base === 0) return cur === 0 ? `<span class="delta is-na">—</span>` : `<span class="delta is-na">new</span>`;
      v = (cur - base) / Math.abs(base);
      const a = Math.abs(v);
      txt = a >= 10 ? `${Math.round(a)}×` : F.pct(a, a < 0.1 ? 1 : 0);
    }
    if (Math.abs(v) < (kind === "pts" ? 0.05 : 0.0005)) return `<span class="delta is-flat">same</span>`;
    const up = v > 0, good = up === goodUp;
    const title = kind === "pts" ? "" : ` title="${esc(F.inr(cur - base, { sign: true }))}"`;
    return `<span class="delta ${good ? "is-good" : "is-bad"}"${title}>${icon(up ? "d-up" : "d-down", "d")}<span class="sr">${up ? "up" : "down"} </span>${txt}</span>`;
  }

  function width(el) { return Math.floor(el.getBoundingClientRect().width); }

  function swap() {
    $$(".swap").forEach((el) => { el.classList.remove("swapping"); void el.offsetWidth; el.classList.add("swapping"); });
  }

  // ---------- Source bar ----------
  function renderSource() {
    const A = S.A;
    const range = `${F.date(A.dataStart)} – ${F.date(A.dataEnd)}`;
    let html;
    if (S.source === "sample") {
      html = `<div class="source-inner is-sample"><span class="source-tag">Sample data</span><span>A synthetic HDFC statement for a salaried professional in Bengaluru, ${range}. Import your own statements to replace it.</span>
        <span class="source-actions"><button class="link" data-act="download-sample">${icon("download")}Download this sample CSV</button><button class="link" data-act="open-import">${icon("upload")}Import yours</button></span></div>`;
    } else {
      const files = (S.meta && S.meta.files) || [];
      const banks = [...new Set(files.map((f) => f.bank).filter(Boolean))];
      html = `<div class="source-inner"><span class="source-tag is-yours">Your data</span><span>${files.length} file${files.length === 1 ? "" : "s"}${banks.length ? " · " + esc(banks.join(", ")) : ""} · ${A.txns.length.toLocaleString("en-IN")} transactions · ${range}${S.source === "stored" ? " · remembered on this device" : ""}</span>
        <span class="source-actions"><button class="link" data-act="open-import">${icon("upload")}Add files</button><button class="link is-danger" data-act="clear">${icon("trash")}Clear data</button></span></div>`;
    }
    $("#sourceBar").innerHTML = html;
  }

  // ---------- Overview ----------
  function verdictText(mo, prev, ly) {
    const name = F.monthName(mo.key);
    const when = mo.partial && mo.partial.to ? `so far in ${name} (to ${F.dateShort(mo.partial.to)})` : `during ${name}`;
    if (mo.income <= 0) return `No income arrived ${when}. You spent <b>${F.inr(mo.spend)}</b>${mo.invested > 0 ? ` and invested <b>${F.inr(mo.invested)}</b>` : ""}.`;
    let s;
    if (mo.kept >= 0) s = `You kept <b class="pos">${F.inr(mo.kept)}</b> of the <b>${F.inr(mo.income)}</b> that came in ${when}: a savings rate of <b class="pos">${F.pct(mo.rate)}</b>.`;
    else s = `You spent <b class="neg">${F.inr(-mo.kept)} more</b> than the <b>${F.inr(mo.income)}</b> that came in ${when}; the gap came out of your balance.`;
    if (prev && prev.rate != null && mo.rate != null && !mo.partial) {
      const d = (mo.rate - prev.rate) * 100;
      const pts = Math.abs(d).toFixed(1).replace(/\.0$/, "");
      if (Math.abs(d) >= 0.5) s += ` That's ${pts} point${pts === "1" ? "" : "s"} ${d > 0 ? "better" : "worse"} than ${F.monthName(prev.key)}`;
      else s += ` About the same as ${F.monthName(prev.key)}`;
      const movers = S.A.spendCats.map((c) => ({ c, d: (mo.cats[c] || 0) - (prev.cats[c] || 0) })).sort((a, b) => (d > 0 ? a.d - b.d : b.d - a.d));
      const m = movers[0];
      if (m && Math.abs(m.d) > 1000 && Math.sign(m.d) === (d > 0 ? -1 : 1)) s += d > 0 ? `, helped by ${F.inr(Math.abs(m.d))} less on ${WD.CAT[m.c].label.toLowerCase()}` : `, mostly because ${WD.CAT[m.c].label.toLowerCase()} cost ${F.inr(Math.abs(m.d))} more`;
      s += ".";
    }
    if (ly && ly.income > 0 && !mo.partial) {
      const sd = mo.spend / ly.spend - 1;
      if (isFinite(sd)) s += ` Spending is ${Math.abs(sd) < 0.01 ? "level with" : `${F.pct(Math.abs(sd))} ${sd > 0 ? "higher" : "lower"} than`} ${F.monthName(ly.key)} ${WD.parseKey(ly.key).y}.`;
    }
    return s;
  }

  function renderOverview() {
    const A = S.A, k = S.sel, mo = A.M[k], i = monthIdx();
    const prev = prevKey() ? A.M[prevKey()] : null;
    const ly = lyKey() ? A.M[lyKey()] : null;
    $("#periodTitle").textContent = F.monthLong(k);
    $("#prevMonth").disabled = i <= 0;
    $("#nextMonth").disabled = i >= A.months.length - 1;
    const bits = [];
    if (mo.partial) bits.push(`<span class="pill">Partial month · ${mo.partial.from ? "from " + F.dateShort(mo.partial.from) : ""}${mo.partial.from && mo.partial.to ? " " : ""}${mo.partial.to ? "to " + F.dateShort(mo.partial.to) : ""}</span>`);
    bits.push(`${mo.count} transactions`);
    if (i < A.months.length - 1) bits.push(`<button class="link" data-act="latest">Jump to latest</button>`);
    $("#periodMeta").innerHTML = bits.join(`<span class="dot" aria-hidden="true"></span>`);
    $("#verdict").innerHTML = verdictText(mo, prev, ly);

    $$("#rangeSeg button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.range === S.range)));
    const box = $("#cfChart");
    box.innerHTML = WD.chartCashflow(A, visibleKeys(), k, width(box));

    const rows = [
      ["Money in", (m) => m.income, true],
      ["Spent", (m) => m.spend, false],
      ["Invested", (m) => m.invested, true],
      ["Kept", (m) => m.kept, true],
      ["Savings rate", (m) => m.rate, true, "pts"],
      ["Month-end balance", (m) => m.closing, true],
    ];
    const cell = (m, f, kind) => (m ? (kind === "pts" ? F.pct(f(m)) : F.inr(f(m))) : "—");
    let t = `<table class="tbl matrix"><caption class="sr">${esc(F.monthLong(k))} compared with the previous month and the same month last year</caption><thead><tr><th scope="col"><span class="sr">Measure</span></th>
      <th scope="col" class="num is-cur">${esc(F.monthShort(k))}</th>
      <th scope="col" class="num col-ref">${prev ? esc(F.monthShort(prev.key)) : "Last month"}</th><th scope="col" class="num">vs ${prev ? esc(F.monthShort(prev.key)) : "last month"}</th>
      <th scope="col" class="num col-ref">${ly ? esc(F.monthShort(ly.key)) : "Last year"}</th><th scope="col" class="num">vs ${ly ? esc(F.monthShort(ly.key)) : "last year"}</th></tr></thead><tbody>`;
    for (const [label, f, goodUp, kind] of rows) {
      t += `<tr${label === "Kept" ? ' class="is-key"' : ""}><th scope="row">${label}</th><td class="num is-cur">${cell(mo, f, kind)}</td>
        <td class="num muted col-ref">${cell(prev, f, kind)}</td><td class="num">${prev ? delta(f(mo), f(prev), goodUp, kind) : "—"}</td>
        <td class="num muted col-ref">${cell(ly, f, kind)}</td><td class="num">${ly ? delta(f(mo), f(ly), goodUp, kind) : "—"}</td></tr>`;
    }
    t += `</tbody></table>`;
    if (!ly) t += `<p class="note">Last-year comparisons appear once your statements cover ${F.monthLong(WD.addMonths(k, -12))}.</p>`;
    $("#matrix").innerHTML = t;

    const ins = WD.insights(A, k);
    S.insights = ins;
    let h = `<div class="insights-head"><h2>Worth a look</h2><p>What stands out in ${esc(F.monthName(k))}, ranked, measured against your own history.</p></div>`;
    if (!ins.length) h += `<p class="empty-note">Nothing unusual this month. Every category stayed within its normal range.</p>`;
    else {
      h += `<ol class="insight-list">`;
      ins.forEach((it, n) => {
        const canShow = it.cat || it.mkey || it.ids;
        h += `<li class="insight tone-${it.tone || "info"}"><div class="insight-fig"><span class="fig">${esc(it.fig || "")}</span><span class="fig-note">${esc(it.figNote || "")}</span></div>
          <div class="insight-body"><p class="insight-title">${esc(it.title)}</p><p class="insight-detail">${esc(it.detail)}</p></div>
          ${canShow ? `<button class="link insight-act" data-act="insight" data-n="${n}">Show payments ${icon("right", "sm")}</button>` : "<span></span>"}</li>`;
      });
      h += `</ol>`;
    }
    $("#insights").innerHTML = h;
  }

  // ---------- Period (month / all to date / full year) ----------
  function period() {
    const A = S.A, k = S.sel, mode = S.yearMode;
    if (S.scope === "month") return { scope: "month", keys: [k], agg: A.M[k], label: F.monthLong(k), short: F.monthShort(k) };
    if (S.scope === "all") {
      const keys = A.months.slice();
      return { scope: "all", keys, agg: WD.aggregate(A, keys), label: `${F.date(A.dataStart)} – ${F.date(A.dataEnd)}`, short: "All to date", base: null, baseAgg: null, baseLabel: null, incomplete: false };
    }
    const y = WD.yearOf(k, mode);
    const slots = WD.yearMonths(y, mode);
    const keys = slots.filter((x) => A.M[x]);
    const base = keys.map((x) => WD.addMonths(x, -12));
    const baseOk = base.every((x) => A.M[x]);
    const span = (ks) => `${WD.MONTH_SHORT[WD.parseKey(ks[0]).m]}–${WD.MONTH_SHORT[WD.parseKey(ks[ks.length - 1]).m]}`;
    const yl = WD.yearLabel(y, mode);
    const label = keys.length < 12 ? `${span(keys)} ${yl}` : yl;
    const baseLabel = !baseOk ? null : keys.length === 12 ? WD.yearLabel(y - 1, mode) : `${span(base)} ${WD.yearLabel(y - 1, mode)}`;
    return {
      scope: S.scope, y, slots, keys, agg: WD.aggregate(A, keys), label, short: label,
      base: baseOk ? base : null, baseAgg: baseOk ? WD.aggregate(A, base) : null, baseLabel,
      incomplete: keys.length < 12,
    };
  }

  function renderPeriodControls() {
    const k = S.sel, mode = S.yearMode, y = WD.yearOf(k, mode);
    const yl = mode === "fy" ? `FY ${String(y).slice(2)}–${String(y + 1).slice(2)}` : String(y);
    const html = `<div class="seg" role="group" aria-label="Period">
        <button data-pscope="month" aria-pressed="${S.scope === "month"}">${esc(F.monthShort(k))}</button>
        <button data-pscope="year" aria-pressed="${S.scope === "year"}">Full ${esc(yl)}</button>
        <button data-pscope="all" aria-pressed="${S.scope === "all"}" title="${esc(F.date(S.A.dataStart) + " – " + F.date(S.A.dataEnd))}">All to date</button></div>
      ${S.scope === "month" ? "" : `<div class="seg" role="group" aria-label="Year type">
        <button data-pyear="cal" aria-pressed="${mode === "cal"}">Calendar</button><button data-pyear="fy" aria-pressed="${mode === "fy"}">Apr–Mar</button></div>`}`;
    $$(".period-ctl").forEach((el) => (el.innerHTML = html));
  }

  // ---------- Flow ----------
  function renderFlow() {
    const P = period(), mo = P.agg;
    const isMonth = P.scope === "month";
    $("#flowSub").textContent = `${P.label}${isMonth ? "" : ` · ${P.keys.length} month${P.keys.length === 1 ? "" : "s"}`}${P.scope === "all" ? ", everything in your statements" : ""}: money in on the left, where it ended up on the right.${mo.partial ? " Includes a partial month." : ""}`;
    const box = $("#flowChart");
    box.innerHTML = width(box) < 560 ? WD.chartFlowList(mo) : WD.chartFlow(mo, width(box));

    const inc = Math.max(1, mo.income);
    const over = mo.kept < 0;
    const left = Math.max(0, mo.income - mo.spend - mo.invested);
    const total = Math.max(mo.income, mo.spend + mo.invested);
    const seg = (cls, v, label) => (v > 0 ? `<span class="nws-seg ${cls}" style="width:${(v / total) * 100}%" data-tip="${esc(label + "|" + F.inr(v) + " · " + F.pct(v / inc) + " of money in")}"></span>` : "");
    const savedPct = (mo.income - mo.spend) / inc;
    const status = (ok, word) => `<span class="guide ${ok ? "is-ok" : "is-over"}">${ok ? icon("check", "sm") + "within guide" : icon("alert", "sm") + word}</span>`;
    let s = `<h3 class="h3">Needs, wants &amp; saved</h3>
      <p class="note">Against the 50 / 30 / 20 guide, as a share of money in.</p>
      <div class="nws-bar${over ? " is-over" : ""}" role="img" aria-label="Needs ${F.pct(mo.need / inc)}, wants ${F.pct(mo.want / inc)}, saved ${F.pct(savedPct)} of money in">
        ${seg("is-need", mo.need, "Needs")}${seg("is-want", mo.want, "Wants")}${seg(over ? "is-inv-funded" : "is-inv", mo.invested, over ? "Invested from your balance" : "Invested")}${seg("is-left", left, "Left in account")}
        <span class="nws-mark" style="left:${(0.5 * inc / total) * 100}%"></span><span class="nws-mark" style="left:${(0.8 * inc / total) * 100}%"></span>
        ${total > mo.income ? `<span class="nws-income" style="left:${(mo.income / total) * 100}%" data-tip="Money in ends here|Everything to the right came from your balance"></span>` : ""}
      </div>
      ${over ? `<p class="nws-warn">${icon("alert", "sm")}Needs and wants came to ${F.pct((mo.need + mo.want) / inc)} of money in. The red line marks where money in ran out${mo.invested > 0 ? `; ${isMonth ? "this month's" : "these"} investments were funded from your balance` : ""}.</p>` : ""}
      <dl class="nws-rows">
        <div><dt><i class="sw sw-need"></i>Needs</dt><dd>${F.inr(mo.need)}</dd><dd class="muted">${F.pct(mo.need / inc)} · aim ≤ 50%</dd><dd>${status(mo.need / inc <= 0.5, "over guide")}</dd></div>
        <div><dt><i class="sw sw-want"></i>Wants</dt><dd>${F.inr(mo.want)}</dd><dd class="muted">${F.pct(mo.want / inc)} · aim ≤ 30%</dd><dd>${status(mo.want / inc <= 0.3, "over guide")}</dd></div>
        <div><dt><i class="sw ${over ? "sw-short" : "sw-saved"}"></i>${over ? "Shortfall" : "Saved &amp; invested"}</dt><dd class="${over ? "neg" : ""}">${over ? "−" + F.inr(-mo.kept) : F.inr(mo.kept)}</dd><dd class="muted">${F.pct(savedPct)} · aim ≥ 20%</dd><dd>${status(savedPct >= 0.2, over ? "overspent" : "below guide")}</dd></div>
      </dl>`;
    const big = mo.txns.filter((t) => t.amount < 0 && t.kind !== "transfer").sort((a, b) => a.amount - b.amount).slice(0, 5);
    s += `<h3 class="h3 mt">Largest payments${isMonth ? "" : ` · ${esc(P.scope === "all" ? "all to date" : P.label)}`}</h3><ol class="big-list">`;
    big.forEach((t) => {
      s += `<li><span class="big-date">${isMonth ? F.dateShort(t.date) : `${F.dateShort(t.date)}<br>${t.date.getFullYear()}`}</span><span class="big-name"><span>${esc(t.merchant)}</span><small>${esc(WD.CAT[t.cat].label)}</small></span><span class="big-amt">${F.inr(-t.amount)}</span></li>`;
    });
    s += `</ol>`;
    $("#flowSide").innerHTML = s;
  }

  // ---------- Categories ----------
  function renderCategories() {
    if (S.scope !== "month") return renderCategoriesPeriod();
    $("#catTitle").textContent = "Categories, month on month";
    const A = S.A, k = S.sel, i = monthIdx(), mo = A.M[k];
    const pk = prevKey(), lk = lyKey();
    $("#catSub").textContent = `${F.monthLong(k)} against ${pk ? F.monthName(pk) : "the month before"}${lk ? ` and ${F.monthShort(lk)}` : ""}. Select a row to see its transactions.`;
    const from = Math.max(0, i - 11);
    const cats = A.spendCats.filter((c) => A.series[c].slice(from, i + 1).some((v) => v > 0))
      .sort((a, b) => (A.series[b][i] - A.series[a][i]) || (WD.sum(A.series[b].slice(from, i + 1)) - WD.sum(A.series[a].slice(from, i + 1))));
    const totalSpend = Math.max(1, mo.spend);
    let t = `<table class="tbl cats"><thead><tr><th scope="col">Category</th><th scope="col" class="num">${esc(F.monthShort(k))}</th><th scope="col" class="num col-opt">Share</th>
      <th scope="col" class="num">vs ${pk ? esc(F.monthShort(pk)) : "last month"}</th><th scope="col" class="num">vs ${lk ? esc(F.monthShort(lk)) : "last year"}</th>
      <th scope="col" class="num col-opt">6-month avg</th><th scope="col" class="trend-col col-opt">Last 12 months</th></tr></thead><tbody>`;
    for (const c of cats) {
      const s = A.series[c], cur = s[i], cat = WD.CAT[c];
      const avg = WD.mean(s.slice(Math.max(0, i - 6), i));
      const prevV = pk ? s[i - 1] : null;
      const lyIdx = lk ? A.months.indexOf(lk) : -1;
      const lyV = lyIdx >= 0 ? s[lyIdx] : null;
      const mini = s.slice(from, i + 1);
      t += `<tr class="row-link" data-act="cat" data-cat="${c}" tabindex="0" aria-label="${esc(cat.label)}: ${F.inr(cur)}. Show transactions">
        <th scope="row"><span class="cat-name"><i class="sw" style="background:${cat.color}"></i>${esc(cat.label)}<small>${WD.KIND_LABEL[cat.kind]}</small></span></th>
        <td class="num strong">${cur ? F.inr(cur) : '<span class="muted">—</span>'}</td>
        <td class="num col-opt"><span class="share"><span class="share-bar" style="width:${Math.min(100, (cur / totalSpend) * 100)}%;background:${cat.color}"></span>${cur ? F.pct(cur / totalSpend) : ""}</span></td>
        <td class="num">${prevV != null ? deltaAbs(cur, prevV) : "—"}</td>
        <td class="num">${lyV != null ? deltaAbs(cur, lyV) : "—"}</td>
        <td class="num muted col-opt">${avg ? F.inr(avg) : "—"}</td>
        <td class="trend-col col-opt">${WD.chartMini(mini, mini.length - 1, cat.color)}</td></tr>`;
    }
    t += `</tbody><tfoot><tr><th scope="row">Total spent</th><td class="num strong">${F.inr(mo.spend)}</td><td class="col-opt"></td>
      <td class="num">${pk ? deltaAbs(mo.spend, A.M[pk].spend) : "—"}</td><td class="num">${lk ? deltaAbs(mo.spend, A.M[lk].spend) : "—"}</td>
      <td class="num muted col-opt">${F.inr(WD.mean(A.months.slice(Math.max(0, i - 6), i).map((x) => A.M[x].spend)))}</td><td class="col-opt"></td></tr></tfoot></table>`;
    $("#catTable").innerHTML = t;
  }

  function renderCategoriesPeriod() {
    if (S.scope === "all") return renderCategoriesAll();
    const A = S.A, P = period(), mo = P.agg, n = P.keys.length;
    $("#catTitle").textContent = "Categories, full year";
    $("#catSub").textContent = `${P.label}${P.incomplete ? ` (${n} of 12 months in your statements)` : ""}${P.base ? ` against ${P.baseLabel}` : ". Last-year comparison needs the same months from the year before"}. Select a row to see its transactions.${mo.partial ? " Includes a partial month." : ""}`;
    const b = P.baseAgg;
    const slotIdx = P.slots.map((x) => A.months.indexOf(x));
    const selSlot = P.slots.indexOf(S.sel);
    const cats = A.spendCats.filter((c) => (mo.cats[c] || 0) > 0 || (b && (b.cats[c] || 0) > 0))
      .sort((x, y) => (mo.cats[y] || 0) - (mo.cats[x] || 0) || ((b && b.cats[y]) || 0) - ((b && b.cats[x]) || 0));
    const totalSpend = Math.max(1, mo.spend);
    let t = `<table class="tbl cats"><thead><tr><th scope="col">Category</th><th scope="col" class="num" title="${esc(P.label)}">Total</th><th scope="col" class="num col-opt">Share</th>
      <th scope="col" class="num" title="${P.base ? esc("vs " + P.baseLabel) : ""}">vs last year</th><th scope="col" class="num">Avg / month</th>
      <th scope="col" class="num col-opt">Last year avg</th><th scope="col" class="trend-col col-opt">Month by month</th></tr></thead><tbody>`;
    for (const c of cats) {
      const cur = mo.cats[c] || 0, cat = WD.CAT[c];
      const bv = b ? b.cats[c] || 0 : null;
      const mini = slotIdx.map((ix) => (ix >= 0 ? A.series[c][ix] : 0));
      t += `<tr class="row-link" data-act="cat" data-cat="${c}" tabindex="0" aria-label="${esc(cat.label)}: ${F.inr(cur)} in ${esc(P.label)}. Show transactions">
        <th scope="row"><span class="cat-name"><i class="sw" style="background:${cat.color}"></i>${esc(cat.label)}<small>${WD.KIND_LABEL[cat.kind]}</small></span></th>
        <td class="num strong">${cur ? F.inr(cur) : '<span class="muted">—</span>'}</td>
        <td class="num col-opt"><span class="share"><span class="share-bar" style="width:${Math.min(100, (cur / totalSpend) * 100)}%;background:${cat.color}"></span>${cur ? F.pct(cur / totalSpend) : ""}</span></td>
        <td class="num">${bv != null ? deltaAbs(cur, bv) : "—"}</td>
        <td class="num">${cur ? F.inr(cur / n) : "—"}</td>
        <td class="num muted col-opt">${bv ? F.inr(bv / n) : "—"}</td>
        <td class="trend-col col-opt">${WD.chartMini(mini, selSlot, cat.color)}</td></tr>`;
    }
    t += `</tbody><tfoot><tr><th scope="row">Total spent</th><td class="num strong">${F.inr(mo.spend)}</td><td class="col-opt"></td>
      <td class="num">${b ? deltaAbs(mo.spend, b.spend) : "—"}</td><td class="num">${F.inr(mo.spend / n)}</td>
      <td class="num muted col-opt">${b ? F.inr(b.spend / n) : "—"}</td><td class="col-opt"></td></tr></tfoot></table>`;
    $("#catTable").innerHTML = t;
  }

  function renderCategoriesAll() {
    const A = S.A, P = period(), mo = P.agg, n = P.keys.length;
    const ys = WD.years(A, S.yearMode);
    $("#catTitle").textContent = "Categories, all to date";
    $("#catSub").textContent = `${P.label}: ${n} months, everything in your statements, with each ${S.yearMode === "fy" ? "financial " : ""}year's total. Part years show how many months they cover. Select a row to see its transactions.`;
    const cats = A.spendCats.filter((c) => (mo.cats[c] || 0) > 0).sort((x, y) => mo.cats[y] - mo.cats[x]);
    const totalSpend = Math.max(1, mo.spend);
    const yearHead = ys.map((y) => `<th scope="col" class="num col-opt">${esc(y.label)}${y.months < 12 ? `<small class="th-sub">${y.months} mo</small>` : ""}</th>`).join("");
    let t = `<table class="tbl cats"><thead><tr><th scope="col">Category</th><th scope="col" class="num">Total</th><th scope="col" class="num col-opt">Share</th>
      <th scope="col" class="num">Avg / month</th>${yearHead}<th scope="col" class="trend-col col-opt">Month by month</th></tr></thead><tbody>`;
    for (const c of cats) {
      const cur = mo.cats[c], cat = WD.CAT[c];
      t += `<tr class="row-link" data-act="cat" data-cat="${c}" tabindex="0" aria-label="${esc(cat.label)}: ${F.inr(cur)} to date. Show transactions">
        <th scope="row"><span class="cat-name"><i class="sw" style="background:${cat.color}"></i>${esc(cat.label)}<small>${WD.KIND_LABEL[cat.kind]}</small></span></th>
        <td class="num strong">${F.inr(cur)}</td>
        <td class="num col-opt"><span class="share"><span class="share-bar" style="width:${Math.min(100, (cur / totalSpend) * 100)}%;background:${cat.color}"></span>${F.pct(cur / totalSpend)}</span></td>
        <td class="num">${F.inr(cur / n)}</td>
        ${ys.map((y) => `<td class="num col-opt">${y.cats[c] ? F.inr(y.cats[c]) : '<span class="muted">—</span>'}</td>`).join("")}
        <td class="trend-col col-opt">${WD.chartMini(A.series[c], A.months.indexOf(S.sel), cat.color)}</td></tr>`;
    }
    t += `</tbody><tfoot><tr><th scope="row">Total spent</th><td class="num strong">${F.inr(mo.spend)}</td><td class="col-opt"></td><td class="num">${F.inr(mo.spend / n)}</td>
      ${ys.map((y) => `<td class="num col-opt">${F.inr(y.spend)}</td>`).join("")}<td class="col-opt"></td></tr></tfoot></table>`;
    $("#catTable").innerHTML = t;
  }

  function deltaAbs(cur, base) {
    const d = cur - base;
    if (!cur && !base) return `<span class="delta is-na">—</span>`;
    if (Math.abs(d) < 1) return `<span class="delta is-flat">same</span>`;
    const up = d > 0;
    const pct = base > 0 ? ` <small class="col-opt-inline">${F.pct(Math.abs(d) / base)}</small>` : "";
    return `<span class="delta ${up ? "is-bad" : "is-good"}">${icon(up ? "d-up" : "d-down", "d")}<span class="sr">${up ? "up" : "down"} </span>${F.inr(Math.abs(d))}${base > 0 && Math.abs(d) / base < 10 ? pct : ""}</span>`;
  }

  // ---------- Years ----------
  function renderYears() {
    const A = S.A, k = S.sel, mode = S.yearMode;
    $$("#yearSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.year === mode)));
    $("#yearSub").textContent = mode === "fy" ? "Indian financial years, April to March." : "Calendar years, January to December.";
    const ys = WD.years(A, mode);
    const curY = WD.yearOf(k, mode);
    let t = `<table class="tbl years"><thead><tr><th scope="col">Year</th><th scope="col" class="num col-opt">Months</th><th scope="col" class="num col-opt">Money in</th><th scope="col" class="num col-opt">Spent</th>
      <th scope="col" class="num col-opt">Invested</th><th scope="col" class="num col-opt">Kept</th><th scope="col" class="num">Savings rate</th><th scope="col" class="num">Avg spend / month</th><th scope="col" class="col-opt">Biggest category</th></tr></thead><tbody>`;
    ys.forEach((y, n) => {
      const p = ys[n - 1];
      const partial = y.months < 12 || y.partialMonths;
      t += `<tr class="${y.y === curY ? "is-cur" : ""}"><th scope="row">${esc(y.label)}${partial ? ' <span class="pill pill-sm">partial</span>' : ""}</th>
        <td class="num muted col-opt">${y.months}</td>
        <td class="num col-opt">${F.inr(y.income)}</td>
        <td class="num col-opt">${F.inr(y.spend)}</td>
        <td class="num col-opt">${F.inr(y.invested)}</td>
        <td class="num col-opt">${F.inr(y.kept)}</td>
        <td class="num">${F.pct(y.rate)}${p ? " " + delta(y.rate, p.rate, true, "pts") : ""}</td>
        <td class="num">${F.inr(y.avgSpend)}${p ? " " + delta(y.avgSpend, p.avgSpend, false) : ""}</td>
        <td class="col-opt">${y.top ? `<span class="cat-name"><i class="sw" style="background:${WD.CAT[y.top[0]].color}"></i>${esc(WD.CAT[y.top[0]].label)}</span>` : "—"}</td></tr>`;
    });
    t += `</tbody></table><p class="note">Year-on-year changes compare average monthly figures, so partial years stay comparable.</p>`;
    $("#yearTable").innerHTML = t;

    const lines = WD.cumulative(A, k, mode);
    const box = $("#cumChart");
    box.innerHTML = `<h3 class="h3">Cumulative spending through the year</h3>` + `<div class="cum-inner"></div>`;
    $(".cum-inner", box).innerHTML = WD.chartCumulative(lines, mode, width(box));

    const ks = WD.yearMonths(curY, mode).filter((x) => x <= k && A.M[x]);
    const lks = ks.map((x) => WD.addMonths(x, -12)).filter((x) => A.M[x]);
    let note = `<h3 class="h3">Year to date</h3>`;
    if (ks.length && lks.length === ks.length) {
      const sp = WD.sum(ks.map((x) => A.M[x].spend)), lsp = WD.sum(lks.map((x) => A.M[x].spend));
      const inc = WD.sum(ks.map((x) => A.M[x].income)), linc = WD.sum(lks.map((x) => A.M[x].income));
      const span = `${WD.MONTH_SHORT[WD.parseKey(ks[0]).m]}–${WD.MONTH_SHORT[WD.parseKey(ks[ks.length - 1]).m]}`;
      const sg = sp / lsp - 1, ig = inc / linc - 1;
      note += `<p class="ytd-line">${span} ${esc(WD.yearLabel(curY, mode))}, against the same months a year earlier.</p>
        <dl class="ytd">
          <div><dt>Spent</dt><dd>${F.inr(sp)}</dd><dd>${delta(sp, lsp, false)}</dd></div>
          <div><dt>Money in</dt><dd>${F.inr(inc)}</dd><dd>${delta(inc, linc, true)}</dd></div>
          <div><dt>Kept</dt><dd>${F.inr(inc - sp)}</dd><dd>${delta(inc - sp, linc - lsp, true)}</dd></div>
        </dl>
        <p class="ytd-verdict ${sg > ig + 0.02 ? "is-warn" : "is-ok"}">${sg > ig + 0.02
          ? `Spending is rising faster than income (${F.pct(sg, 1)} against ${F.pct(ig, 1)}). That gap is lifestyle inflation; left alone it erodes the savings rate each year.`
          : `Income is keeping ahead of spending (${F.pct(ig, 1)} against ${F.pct(sg, 1)}), so raises are turning into savings rather than lifestyle.`}</p>`;
    } else {
      note += `<p class="note">A year-to-date comparison needs the same months from the previous year in your statements.</p>`;
    }
    $("#yearNote").innerHTML = note;
  }

  // ---------- Investments ----------
  function renderInvestments() {
    const A = S.A, inv = WD.investments(A);
    $("#invSub").textContent = "Money moved from this account into SIPs, PPF, deposits and brokers. A bank statement can't see returns or current value, so this tracks what you put in and what came back.";
    if (!inv.out) {
      $("#invVerdict").innerHTML = "No investments found in these statements yet. SIPs, PPF, FDs and broker transfers appear here automatically; you can also set any payment's category to Investments in Transactions.";
      ["#invLegend", "#invChart", "#invSide", "#invTable"].forEach((s) => ($(s).innerHTML = ""));
      return;
    }
    const l12 = inv.last12, p12 = inv.prev12;
    let v = `You've put <b class="pos">${F.inr(inv.out)}</b> into investments since ${F.dateShort(A.dataStart)} ${A.dataStart.getFullYear()}: <b>${F.pct(inv.out / Math.max(1, inv.income))}</b> of everything that came in.`;
    v += ` In the last 12 months it was <b>${F.inr(l12.out)}</b>, ${F.pct(l12.out / Math.max(1, l12.income))} of money in`;
    if (p12 && p12.out > 0) { const g = l12.out / p12.out - 1; v += `, ${Math.abs(g) < 0.01 ? "level with" : `${F.pct(Math.abs(g))} ${g > 0 ? "more than" : "less than"}`} the 12 months before`; }
    v += ".";
    if (inv.back) v += ` ${F.inr(inv.back)} came back out as withdrawals or redemptions.`;
    $("#invVerdict").innerHTML = v;

    const used = WD.INSTRUMENTS.filter((ins) => inv.byInst[ins.id]);
    $("#invLegend").innerHTML = used.map((ins) => `<span><i class="sw" style="background:${ins.color}"></i>${esc(ins.label)}</span>`).join("") + (inv.back ? `<span><i class="sw sw-back"></i>Withdrawn</span>` : "");
    const box = $("#invChart");
    box.innerHTML = WD.chartInvest(inv, A.months, S.sel, width(box));

    const fact = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
    let s = `<dl class="runway-facts inv-facts">
      ${fact("Invested to date", F.inr(inv.out))}
      ${fact(`Last ${l12.n} months`, `${F.inr(l12.out)} <small class="muted">${F.pct(l12.out / Math.max(1, l12.income))} of money in</small>`)}
      ${fact("Average per month", `${F.inr(l12.out / l12.n)} <small class="muted">last ${l12.n} months</small>`)}
      ${fact("Regular commitment", inv.commitment ? `${F.inr(inv.commitment)} / month` : "—")}
      ${fact("Months with an investment", `${inv.monthsWith} of ${A.months.length}`)}
      ${inv.back ? fact("Withdrawn or redeemed", F.inr(inv.back)) : ""}
    </dl><h3 class="h3 mt">By instrument</h3><ol class="flow-list inv-mix">`;
    const maxI = Math.max(...used.map((ins) => inv.byInst[ins.id]));
    used.sort((a, b) => inv.byInst[b.id] - inv.byInst[a.id]).forEach((ins) => {
      const a = inv.byInst[ins.id];
      s += `<li><span class="fl-label">${esc(ins.label)}</span><span class="fl-value">${F.inr(a)} <small>${F.pct(a / inv.out)}</small></span><span class="fl-bar"><i style="width:${(a / maxI) * 100}%;background:${ins.color}"></i></span></li>`;
    });
    $("#invSide").innerHTML = s + `</ol>`;

    const instLabel = Object.fromEntries(WD.INSTRUMENTS.map((x) => [x.id, x]));
    let t = `<table class="tbl rec inv"><thead><tr><th scope="col">Paid to</th><th scope="col" class="col-opt">Instrument</th><th scope="col" class="col-opt">Rhythm</th><th scope="col" class="num col-opt">Latest</th><th scope="col" class="col-opt">Step-ups</th><th scope="col" class="col-opt">Consistency</th><th scope="col" class="num">Last 12 months</th><th scope="col" class="num">To date</th><th scope="col" class="col-opt">Since</th></tr></thead><tbody>`;
    inv.dests.forEach((d) => {
      const ins = instLabel[d.inst];
      const c = d.consistency;
      const cons = c ? (c.paid >= c.expected ? `<span class="guide is-ok">${icon("check", "sm")}every month</span>` : `<span class="guide is-over">${c.paid} of ${c.expected} months</span>`) : `<span class="muted">—</span>`;
      const ch = d.change ? `<span class="delta ${d.change.to > d.change.from ? "is-good" : "is-bad"}">${icon(d.change.to > d.change.from ? "d-up" : "d-down", "d")}from ${F.inr(d.change.from)}</span> <small class="muted">${F.monthShort(WD.keyOf(d.change.date))}</small>` : `<span class="muted">${d.recurring ? "steady" : "—"}</span>`;
      const stopped = d.recurring && !d.active;
      t += `<tr class="row-link${stopped ? " is-stopped" : ""}" data-act="merchant" data-mkey="${esc(d.key)}" data-name="${esc(d.name)}" tabindex="0" aria-label="${esc(d.name)}. Show payments">
        <th scope="row"><span class="payee">${esc(d.name)}${stopped ? ' <span class="pill pill-sm">stopped</span>' : ""}</span><small class="m-only muted">${esc(ins.label)} · ${d.cadence}</small></th>
        <td class="col-opt"><span class="cat-name"><i class="sw" style="background:${ins.color}"></i>${esc(ins.label)}</span></td>
        <td class="muted col-opt">${d.cadence}</td>
        <td class="num col-opt">${F.inr(d.latest)}</td>
        <td class="col-opt">${ch}</td>
        <td class="col-opt">${cons}</td>
        <td class="num strong">${d.last12 ? F.inr(d.last12) : '<span class="muted">—</span>'}</td>
        <td class="num">${F.inr(d.total)}</td>
        <td class="muted col-opt">${F.monthShort(WD.keyOf(d.first))}</td></tr>`;
    });
    $("#invTable").innerHTML = t + `</tbody></table>`;
  }

  // ---------- Habits ----------
  function renderHabits() {
    const A = S.A, k = S.sel;
    const d = WD.daily(A, k);
    const box = $("#heatmap");
    const narrow = width(box) < 600;
    $("#habitSub").textContent = narrow
      ? `Day-to-day spending. The calendar shows the last 26 weeks to ${F.monthLong(k)}; the averages below cover 12 months. Rent, EMIs, investments, insurance and card bills are left out.`
      : `Day-to-day spending for the 12 months to ${F.monthLong(k)}. Rent, EMIs, investments, insurance and card bills are left out so everyday habits show through.`;
    const hm = WD.chartHeatmap(d, width(box));
    box.innerHTML = hm ? `${hm.svg}<div class="hm-legend"><span>Less</span>${[0, 1, 2, 3, 4, 5].map((l) => `<i class="hm l${l}"></i>`).join("")}<span>More</span><span class="muted">· darkest days above ${F.compact(hm.th[3])}</span></div>` : "";

    const wd = d.weekday;
    const weekdayAvg = WD.mean(wd.slice(0, 5)), weekendAvg = WD.mean(wd.slice(5));
    const ratio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : null;
    $("#weekdayNote").innerHTML = ratio ? (ratio > 1.1 ? `A weekend day costs <b>${ratio.toFixed(1)}×</b> a weekday on average (${F.inr(weekendAvg)} against ${F.inr(weekdayAvg)}).` : ratio < 0.9 ? `Weekdays cost more than weekends: ${F.inr(weekdayAvg)} a day against ${F.inr(weekendAvg)}.` : `Weekdays and weekends cost about the same, around ${F.inr(weekdayAvg)} a day.`) : "";
    const wbox = $("#weekdayChart");
    wbox.innerHTML = WD.chartWeekday(wd, width(wbox));

    const keys12 = WD.windowStats(A, k, 12).keys;
    const ch = WD.channels(A, keys12);
    const top = ch.list[0];
    $("#channelNote").innerHTML = top ? `<b>${esc(top.name)}</b> carries ${F.pct(top.share)} of the money you spent in the last 12 months.` : "";
    const CH_COLOR = { UPI: "oklch(0.52 0.1 265)", Card: "oklch(0.7 0.08 225)", "Auto-debit": "oklch(0.6 0.03 250)", "Bank transfer": "oklch(0.7 0.07 110)", "ATM cash": "oklch(0.72 0.1 65)", Cheque: "oklch(0.65 0.06 320)", Other: "oklch(0.8 0.01 160)" };
    let h = `<div class="mix-bar" role="img" aria-label="Payment channel mix">${ch.list.map((c) => `<span style="width:${c.share * 100}%;background:${CH_COLOR[c.name] || CH_COLOR.Other}" data-tip="${esc(c.name + "|" + F.inr(c.amount) + " · " + F.pct(c.share))}"></span>`).join("")}</div>`;
    h += `<table class="tbl tbl-compact"><thead><tr><th scope="col">Channel</th><th scope="col" class="num">Share</th><th scope="col" class="num">Payments</th><th scope="col" class="num">Avg payment</th></tr></thead><tbody>`;
    ch.list.forEach((c) => { h += `<tr><th scope="row"><span class="cat-name"><i class="sw" style="background:${CH_COLOR[c.name] || CH_COLOR.Other}"></i>${esc(c.name)}</span></th><td class="num">${c.share > 0 && c.share < 0.005 ? "&lt;1%" : F.pct(c.share)}</td><td class="num">${c.count.toLocaleString("en-IN")}</td><td class="num">${F.inr(c.avg)}</td></tr>`; });
    h += `</tbody></table>`;
    $("#channelMix").innerHTML = h;
  }

  // ---------- Recurring ----------
  function renderRecurring() {
    const A = S.A;
    const list = A.recurring.filter((r) => r.active || S.showStopped);
    const active = A.recurring.filter((r) => r.active);
    const monthly = WD.sum(active.map((r) => r.annual / 12));
    const subs = active.filter((r) => r.cat === "subscriptions");
    const subsM = WD.sum(subs.map((r) => r.annual / 12));
    $("#recSub").innerHTML = active.length
      ? `<b>${F.inr(monthly)}</b> a month is committed to ${active.length} regular payments. Subscriptions are ${F.inr(subsM)} of that (${F.inr(subsM * 12)} a year across ${subs.length}).`
      : "No regular payments found yet. They show up once the same merchant is paid on a steady rhythm for three months.";
    $("#showStopped").checked = S.showStopped;
    if (!list.length) { $("#recTable").innerHTML = ""; return; }
    let t = `<table class="tbl rec"><thead><tr><th scope="col">Payee</th><th scope="col" class="col-opt">Category</th><th scope="col" class="col-opt">Rhythm</th><th scope="col" class="num">Amount</th><th scope="col" class="col-opt">Change</th><th scope="col" class="num">Per year</th><th scope="col" class="col-opt">Next expected</th><th scope="col" class="col-opt">Since</th></tr></thead><tbody>`;
    list.forEach((r) => {
      const cat = WD.CAT[r.cat];
      const ch = r.change ? `<span class="delta ${r.change.to > r.change.from ? "is-bad" : "is-good"}">${icon(r.change.to > r.change.from ? "d-up" : "d-down", "d")}from ${F.inr(r.change.from)}</span> <small class="muted">${F.monthShort(WD.keyOf(r.change.date))}</small>` : `<span class="muted">${r.variable ? "varies" : "steady"}</span>`;
      t += `<tr class="row-link${r.active ? "" : " is-stopped"}" data-act="merchant" data-mkey="${esc(r.key)}" data-name="${esc(r.name)}" tabindex="0" aria-label="${esc(r.name)}. Show payments">
        <th scope="row"><span class="payee">${esc(r.name)}${r.active ? "" : ' <span class="pill pill-sm">stopped</span>'}</span><small class="m-only muted">${esc(cat.label)} · ${r.cadence}${r.change ? ` · was ${F.inr(r.change.from)}` : ""}</small></th>
        <td class="col-opt"><span class="cat-name"><i class="sw" style="background:${cat.color}"></i>${esc(cat.label)}</span></td>
        <td class="muted col-opt">${r.cadence}</td>
        <td class="num strong">${r.variable ? "~" : ""}${F.inr(r.typical)}</td>
        <td class="col-opt">${ch}</td>
        <td class="num">${F.inr(r.annual)}</td>
        <td class="col-opt">${r.active ? F.date(r.next) : `<span class="muted">last ${F.date(r.last)}</span>`}</td>
        <td class="muted col-opt">${F.monthShort(WD.keyOf(r.first))}</td></tr>`;
    });
    t += `</tbody></table>`;
    $("#recTable").innerHTML = t;
  }

  // ---------- Balance ----------
  function renderBalance() {
    const A = S.A, k = S.sel;
    const run = WD.runway(A, k);
    $("#balSub").textContent = A.hasBalance ? "Month-end balance. Where a month dipped well below its closing balance, a faint bar drops to the lowest point; hover any month for its low." : "Your statement has no balance column, so balances are rebuilt from transactions and start at zero.";
    const box = $("#balChart");
    box.innerHTML = WD.chartBalance(A, visibleKeys(), k, width(box), run.essentials);
    const months = run.months;
    const pct = months != null ? Math.min(1, months / 6) : 0;
    const mo = A.M[k];
    $("#runway").innerHTML = months == null ? `<p class="note">Runway needs a balance and at least one month of essential spending.</p>` : `
      <p class="runway-line">Your balance at the end of ${esc(F.monthName(k))} would cover <b class="${months >= 6 ? "pos" : months >= 3 ? "" : "neg"}">${months.toFixed(1)} months</b> of essentials.</p>
      <div class="runway-bar" role="img" aria-label="${months.toFixed(1)} of 6 months"><span style="width:${pct * 100}%"></span><i style="left:50%"></i></div>
      <div class="runway-scale"><span>0</span><span>3 months</span><span>6 months</span></div>
      <dl class="runway-facts">
        <div><dt>Month-end balance</dt><dd>${F.inr(run.balance)}</dd></div>
        <div><dt>Essentials, 6-month average</dt><dd>${F.inr(run.essentials)} / month</dd></div>
        <div><dt>Lowest point this month</dt><dd>${mo.minBal != null ? `${F.inr(mo.minBal)} <small class="muted">on ${F.dateShort(mo.minBalDate)}</small>` : "—"}</dd></div>
        <div><dt>Six-month cushion</dt><dd>${run.essentials * 6 > run.balance ? `${F.inr(run.essentials * 6 - run.balance)} short` : `${F.inr(run.balance - run.essentials * 6)} above`}</dd></div>
      </dl>
      <p class="note">Essentials are rent, groceries, bills, EMIs, insurance, health, transport, education and family support. A common rule of thumb is three to six months of them in reach.</p>`;
  }

  // ---------- Ledger ----------
  function catOptions(selected, includeAll) {
    let o = includeAll ? `<option value="">All categories</option>` : "";
    const groups = [["income", "Money in"], ["need", "Needs"], ["want", "Wants"], ["save", "Invested"], ["transfer", "Not counted"]];
    for (const [kind, label] of groups) {
      o += `<optgroup label="${label}">` + WD.CATEGORIES.filter((c) => c.kind === kind).map((c) => `<option value="${c.id}"${c.id === selected ? " selected" : ""}>${esc(c.label)}</option>`).join("") + `</optgroup>`;
    }
    return o;
  }

  function ledgerList() {
    const L = S.led;
    let list = S.A.txns;
    if (L.ids) { const set = new Set(L.ids); list = list.filter((t) => set.has(t.id)); }
    else {
      if (L.keys) { const set = new Set(L.keys); list = list.filter((t) => set.has(t.key)); }
      else if (L.scope === "month") list = list.filter((t) => t.key === S.sel);
      if (L.cat) list = list.filter((t) => t.cat === L.cat);
      if (L.mkey) list = list.filter((t) => t.mkey === L.mkey);
      if (L.dir === "out") list = list.filter((t) => t.amount < 0);
      if (L.dir === "in") list = list.filter((t) => t.amount > 0);
      if (L.q) { const q = L.q.toLowerCase(); list = list.filter((t) => t.merchant.toLowerCase().includes(q) || t.narration.toLowerCase().includes(q)); }
    }
    return list.slice().sort((a, b) => b.date - a.date || b.id - a.id);
  }

  function renderLedger() {
    const L = S.led;
    $("#ledCat").innerHTML = catOptions(L.cat, true);
    $$("#ledDir button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === L.dir)));
    $$("#ledScope button").forEach((b) => b.setAttribute("aria-pressed", String(!L.keys && b.dataset.scope === L.scope)));
    $("#ledScopeMonth").textContent = F.monthShort(S.sel);
    const list = ledgerList();
    const filt = [];
    if (L.ids) filt.push(L.label || "Selected payments");
    if (L.mkey) filt.push(`Payee: ${L.label || L.mkey}`);
    if (L.keys && !L.ids) filt.push(`Period: ${L.periodLabel}`);
    $("#ledFilter").innerHTML = filt.length ? `<span class="chip">${esc(filt.join(" · "))}<button class="chip-x" data-act="clear-filter" aria-label="Clear filter">${icon("close", "sm")}</button></span>` : "";
    const out = WD.sum(list.filter((t) => t.amount < 0).map((t) => -t.amount)), inn = WD.sum(list.filter((t) => t.amount > 0).map((t) => t.amount));
    let t = `<p class="ledger-sum">${list.length.toLocaleString("en-IN")} transactions · <span class="pos">${F.inr(inn)} in</span> · ${F.inr(out)} out</p>`;
    if (!list.length) { $("#ledTable").innerHTML = t + `<p class="empty-note">No transactions match. Try another month or clear the search.</p>`; $("#ledMore").innerHTML = ""; return; }
    t += `<table class="tbl ledger"><thead><tr><th scope="col" class="col-opt">Date</th><th scope="col">Description</th><th scope="col" class="col-opt">Category</th><th scope="col" class="col-opt">Channel</th><th scope="col" class="num">Amount</th></tr></thead><tbody>`;
    list.slice(0, L.limit).forEach((x) => {
      const how = x.how === "fallback" ? `<span class="how" title="No keyword matched; set it once and it sticks">unmatched</span>` : x.how === "yours" ? `<span class="how is-yours">yours</span>` : "";
      t += `<tr><td class="nowrap muted col-opt">${F.date(x.date)}</td>
        <td class="desc"><span class="desc-main">${esc(x.merchant)}</span><small class="m-only muted">${F.dateShort(x.date)} · ${esc(x.channel)}</small><span class="desc-raw" title="${esc(x.narration)}">${esc(x.narration)}</span>
          <span class="m-only m-cat"><select class="cat-select" data-id="${x.id}" aria-label="Category for ${esc(x.merchant)}">${catOptions(x.cat)}</select>${how}</span></td>
        <td class="col-opt"><select class="cat-select" data-id="${x.id}" aria-label="Category for ${esc(x.merchant)}">${catOptions(x.cat)}</select>${how}</td>
        <td class="muted nowrap col-opt">${esc(x.channel)}</td>
        <td class="num strong ${x.amount > 0 ? "pos" : ""}">${x.amount > 0 ? "+" : ""}${F.inr(Math.abs(x.amount))}</td></tr>`;
    });
    t += `</tbody></table>`;
    $("#ledTable").innerHTML = t;
    $("#ledMore").innerHTML = list.length > L.limit ? `<button class="btn" data-act="more">Show ${Math.min(100, list.length - L.limit)} more <span class="muted">of ${(list.length - L.limit).toLocaleString("en-IN")}</span></button>` : "";
  }

  function recategorise(id, cat) {
    const t = S.A.txns.find((x) => x.id === id);
    if (!t) return;
    const before = WD.loadOverrides();
    const scope = $("#categoryScope").value;
    const o = WD.withCategoryOverride(before, t, cat, scope);
    if (!WD.saveOverrides(o)) {
      renderLedger();
      toast("Couldn't save this category change. Browser storage may be full or blocked. Allow storage and try again.");
      return;
    }
    const same = S.txns.filter((x) => {
      const key = WD.transactionOverrideKey(x);
      const nextCat = o[key] || o[WD.overrideKey(x)] || x.cat;
      return (scope === "merchant" ? WD.overrideKey(x) === WD.overrideKey(t) : key === WD.transactionOverrideKey(t)) && x.cat !== nextCat;
    }).length;
    reanalyse();
    toast(`${same} payment${same === 1 ? "" : "s"} for ${t.merchant} moved to ${WD.CAT[cat].label}.`, () => {
      if (WD.saveOverrides(before)) reanalyse();
      else toast("Couldn't undo the category change. Allow browser storage and try changing the category again.");
    });
  }

  function scrollToLedger() {
    $("#ledger").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  // ---------- Import ----------
  function openImport(open = true) {
    const p = $("#importPanel");
    p.hidden = !open;
    $("#importBtn").setAttribute("aria-expanded", String(open));
    if (open) { window.scrollTo({ top: 0 }); $("#fileInput").focus({ preventScroll: true }); }
    else { S.pending = []; renderImport(); }
  }

  async function addFiles(files) {
    for (const f of files) {
      try { S.pending.push(await WD.readStatementFile(f)); }
      catch (e) { S.pending.push({ name: f.name, error: e.message }); }
    }
    renderImport();
  }

  function extractPending(p) {
    if (p.error || !p.ok) return null;
    try { return WD.extract(p.rows, p.headerRow, p.map); } catch (e) { return null; }
  }

  function renderImport() {
    const box = $("#importFiles");
    let h = "", total = 0;
    S.pending.forEach((p, n) => {
      if (p.error) {
        h += `<div class="ifile is-error"><div class="ifile-head">${icon("alert")}<strong>${esc(p.name)}</strong><button class="link" data-act="remove-file" data-n="${n}">Remove</button></div><p>${esc(p.error)}</p></div>`;
        return;
      }
      if (!p.ok) {
        h += `<div class="ifile is-error"><div class="ifile-head">${icon("alert")}<strong>${esc(p.name)}</strong><button class="link" data-act="remove-file" data-n="${n}">Remove</button></div><p>Couldn't find a table with dates and amounts in this file. Is it the transaction statement (not a summary)?</p></div>`;
        return;
      }
      const ex = extractPending(p);
      const count = ex ? ex.txns.length : 0;
      total += count;
      const range = ex && count ? `${F.date(ex.txns[0].date)} – ${F.date(ex.txns[count - 1].date)}` : "";
      const opts = (field) => `<option value="">—</option>` + p.headers.map((hd, c) => `<option value="${c}"${p.map[field] === c ? " selected" : ""}>${esc(hd)}</option>`).join("");
      h += `<div class="ifile${count ? "" : " is-warn"}">
        <div class="ifile-head">${icon("file")}<strong>${esc(p.name)}</strong>${p.bank ? `<span class="pill">${esc(p.bank)}</span>` : ""}
          <span class="ifile-stat">${count ? `${count.toLocaleString("en-IN")} transactions · ${range}` : "No transactions read yet. Check the columns below."}${ex && ex.skipped ? ` · ${ex.skipped} non-transaction rows skipped` : ""}</span>
          <button class="link" data-act="remove-file" data-n="${n}">Remove</button></div>
        <div class="ifile-map">${WD.FIELDS.map((f) => `<label><span>${WD.FIELD_LABELS[f]}</span><select data-act="map" data-n="${n}" data-field="${f}">${opts(f)}</select></label>`).join("")}</div>`;
      if (count) {
        h += `<table class="tbl tbl-compact ipreview"><thead><tr><th>Date</th><th>Description</th><th class="num">Amount</th><th class="num">Balance</th></tr></thead><tbody>${ex.txns.slice(0, 4).map((t) => `<tr><td class="nowrap">${F.date(t.date)}</td><td><span class="desc-raw">${esc(t.narration)}</span></td><td class="num ${t.amount > 0 ? "pos" : ""}">${t.amount > 0 ? "+" : "−"}${F.inr(Math.abs(t.amount))}</td><td class="num muted">${t.balance != null ? F.inr(t.balance) : "—"}</td></tr>`).join("")}</tbody></table>`;
      }
      h += `</div>`;
    });
    box.innerHTML = h;
    const btn = $("#importApply");
    btn.disabled = total === 0;
    btn.textContent = total ? `Analyse ${total.toLocaleString("en-IN")} transactions` : "Analyse";
  }

  function applyImport() {
    const seen = new Set(), all = [], files = [];
    const push = (t) => {
      const key = `${+t.date}|${t.amount}|${t.narration}|${t.balance}`;
      if (seen.has(key)) return false;
      seen.add(key); all.push({ date: t.date, narration: t.narration, amount: t.amount, balance: t.balance });
      return true;
    };
    const merging = S.source !== "sample";
    if (merging) S.txns.forEach(push);
    for (const p of S.pending) {
      const ex = extractPending(p);
      if (!ex || !ex.txns.length) continue;
      let added = 0;
      for (const t of ex.txns) if (push(t)) added++;
      files.push({ name: p.name, bank: p.bank, count: added });
    }
    if (!files.length) return;
    const allFiles = merging && S.meta && S.meta.files ? [...S.meta.files, ...files] : files;
    const newCount = WD.sum(files.map((f) => f.count));
    const remember = $("#remember").checked || (merging && S.source === "stored");
    S.pending = [];
    openImport(false);
    loadTxns(all, remember ? "stored" : "import", { files: allFiles });
    if (remember) saveStored(); else { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } }
    toast(`${merging ? "Added" : "Analysed"} ${newCount.toLocaleString("en-IN")} transactions from ${files.length} file${files.length === 1 ? "" : "s"}${merging ? `; ${all.length.toLocaleString("en-IN")} in total` : ""}.`);
  }

  // ---------- Toast & tooltip ----------
  let toastTimer;
  function toast(msg, undo) {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button class="link" id="toastUndo">Undo</button>` : ""}`;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add("is-on");
    if (undo) $("#toastUndo").onclick = () => { hideToast(); undo(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, undo ? 8000 : 4000);
  }
  function hideToast() { const el = $("#toast"); el.classList.remove("is-on"); setTimeout(() => { if (!el.classList.contains("is-on")) el.hidden = true; }, 220); }

  const tipEl = () => $("#tooltip");
  function showTip(target, x, y) {
    const parts = target.getAttribute("data-tip").split("|");
    const el = tipEl();
    el.innerHTML = `<strong>${esc(parts[0])}</strong>${parts.slice(1).map((p) => `<span>${esc(p)}</span>`).join("")}`;
    el.hidden = false;
    const r = el.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    el.style.left = Math.max(8, left) + "px";
    el.style.top = Math.max(8, top) + "px";
  }

  function setYearMode(mode) {
    S.yearMode = mode;
    renderPeriodControls(); renderYears();
    if (S.scope !== "month") { renderFlow(); renderCategories(); }
  }

  // ---------- Render all ----------
  function renderAll() {
    renderSource(); renderOverview(); renderPeriodControls(); renderFlow(); renderCategories(); renderYears(); renderInvestments();
    renderHabits(); renderRecurring(); renderBalance(); renderLedger();
  }

  function select(k, focus) {
    if (!k || k === S.sel) return;
    S.sel = k;
    S.led.limit = 60;
    renderAll();
    swap();
    if (focus) { const el = $(`.cf-col[data-key="${k}"]`); if (el) el.focus(); }
  }

  // ---------- Events ----------
  function bind() {
    $("#importBtn").addEventListener("click", () => openImport($("#importPanel").hidden));
    $("#importClose").addEventListener("click", () => openImport(false));
    $("#importCancel").addEventListener("click", () => openImport(false));
    $("#importApply").addEventListener("click", applyImport);
    $("#fileInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
    const drop = $("#drop");
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", (e) => addFiles([...e.dataTransfer.files]));
    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => { e.preventDefault(); if (e.dataTransfer.files.length) { openImport(true); addFiles([...e.dataTransfer.files]); } });

    $("#prevMonth").addEventListener("click", () => select(S.A.months[monthIdx() - 1]));
    $("#nextMonth").addEventListener("click", () => select(S.A.months[monthIdx() + 1]));
    $("#rangeSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.range = +b.dataset.range; renderOverview(); renderBalance(); });
    $("#yearSeg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setYearMode(b.dataset.year); });
    $("#showStopped").addEventListener("change", (e) => { S.showStopped = e.target.checked; renderRecurring(); });

    $("#ledQ").addEventListener("input", (e) => { S.led.q = e.target.value.trim(); S.led.limit = 60; renderLedger(); });
    $("#ledCat").addEventListener("change", (e) => { S.led.cat = e.target.value; S.led.ids = null; S.led.limit = 60; renderLedger(); });
    $("#ledDir").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.led.dir = b.dataset.dir; renderLedger(); });
    $("#ledScope").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; S.led.scope = b.dataset.scope; S.led.ids = null; S.led.keys = null; renderLedger(); });

    document.addEventListener("change", (e) => {
      const sel = e.target.closest(".cat-select");
      if (sel) return recategorise(+sel.dataset.id, sel.value);
      const map = e.target.closest('[data-act="map"]');
      if (map) {
        const p = S.pending[+map.dataset.n];
        if (map.value === "") delete p.map[map.dataset.field]; else p.map[map.dataset.field] = +map.value;
        renderImport();
      }
    });

    document.addEventListener("click", (e) => {
      const col = e.target.closest(".cf-col");
      if (col) return select(col.dataset.key, true);
      const icol = e.target.closest(".inv-col");
      if (icol) return select(icol.dataset.key);
      const ps = e.target.closest("[data-pscope]");
      if (ps) { S.scope = ps.dataset.pscope; renderPeriodControls(); renderFlow(); renderCategories(); return; }
      const py = e.target.closest("[data-pyear]");
      if (py) return setYearMode(py.dataset.pyear);
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const act = a.dataset.act;
      if (act === "open-import") openImport(true);
      else if (act === "download-sample") {
        const blob = new Blob([WD.buildSampleCSV()], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob); link.download = "sample-hdfc-statement.csv";
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      } else if (act === "clear") {
        try {
          localStorage.removeItem(STORE_KEY);
          localStorage.removeItem("wdmmg.rules.v1");
        } catch (err) {
          toast("Couldn't clear saved data. Allow browser storage and try again.");
          return;
        }
        loadSample();
        toast("Your data was cleared from this page and this device. Showing the sample again.");
      } else if (act === "latest") select(S.A.months[S.A.months.length - 1]);
      else if (act === "insight") {
        const it = S.insights[+a.dataset.n];
        S.led = { ...S.led, q: "", dir: "", limit: 60, ids: null, mkey: null, keys: null, cat: "", label: "", scope: "month" };
        if (it.ids) { S.led.ids = it.ids; S.led.label = it.title; }
        else if (it.mkey) { S.led.mkey = it.mkey; S.led.scope = "all"; S.led.label = it.title.replace(/^New recurring payment: /, "").replace(/ went up.*$/, ""); }
        else if (it.cat) S.led.cat = it.cat;
        $("#ledQ").value = "";
        renderLedger(); scrollToLedger();
      } else if (act === "cat") {
        const P = period();
        S.led = { ...S.led, cat: a.dataset.cat, ids: null, mkey: null, q: "", dir: "", scope: "month", limit: 60, keys: P.scope === "month" ? null : P.keys, periodLabel: P.label };
        $("#ledQ").value = "";
        renderLedger(); scrollToLedger();
      } else if (act === "merchant") {
        S.led = { ...S.led, mkey: a.dataset.mkey, label: a.dataset.name, ids: null, keys: null, cat: "", q: "", dir: "", scope: "all", limit: 60 };
        $("#ledQ").value = "";
        renderLedger(); scrollToLedger();
      } else if (act === "clear-filter") {
        S.led = { ...S.led, mkey: null, ids: null, keys: null, label: "" };
        renderLedger();
      } else if (act === "more") { S.led.limit += 100; renderLedger(); }
      else if (act === "remove-file") { S.pending.splice(+a.dataset.n, 1); renderImport(); }
    });

    document.addEventListener("keydown", (e) => {
      const col = e.target.closest && e.target.closest(".cf-col");
      if (col) {
        const i = S.A.months.indexOf(col.dataset.key);
        let n = null;
        if (e.key === "ArrowLeft") n = S.A.months[i - 1];
        else if (e.key === "ArrowRight") n = S.A.months[i + 1];
        else if (e.key === "Home") n = visibleKeys()[0];
        else if (e.key === "End") n = S.A.months[S.A.months.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
        return;
      }
      const row = e.target.closest && e.target.closest(".row-link");
      if (row && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); row.click(); }
      if (e.key === "Escape" && !$("#importPanel").hidden) openImport(false);
    });

    document.addEventListener("mousemove", (e) => {
      const t = e.target.closest && e.target.closest("[data-tip]");
      if (t) showTip(t, e.clientX, e.clientY); else tipEl().hidden = true;
    });
    document.addEventListener("focusin", (e) => {
      const t = e.target.closest && e.target.closest("[data-tip]");
      if (t) { const r = t.getBoundingClientRect(); showTip(t, r.left + r.width / 2, r.bottom); } else tipEl().hidden = true;
    });
    document.addEventListener("scroll", () => (tipEl().hidden = true), { passive: true });

    let rt;
    let lastW = innerWidth;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - lastW) > 4 && S.A) { lastW = innerWidth; renderAll(); } }, 150); });

    const links = $$(".sections a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main .sec").forEach((s) => io.observe(s));
  }

  function start() {
    if (innerWidth < 720) S.range = 12;
    bind();
    if (!loadStored()) loadSample();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => S.A && renderAll());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
