(function () {
  "use strict";
  const WD = (window.WD = window.WD || {});
  const F = () => WD.fmt;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  WD.esc = esc;

  function niceStep(max, count) {
    if (max <= 0) return 1;
    const raw = max / count;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw) return m * p;
    return 10 * p;
  }
  const tip = (lines) => esc(lines.join("|"));

  // ---------- Cash flow: income above the axis, spending below, net kept as a line ----------
  WD.chartCashflow = function (A, keys, selected, width) {
    const H = 268, padL = 52, padR = 8, padT = 14, padB = 40;
    const W = Math.max(320, width);
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const maxIn = Math.max(1, ...keys.map((k) => A.M[k].income));
    const maxOut = Math.max(1, ...keys.map((k) => A.M[k].spend + A.M[k].invested));
    const step = niceStep(Math.max(maxIn, maxOut), 4);
    const topV = Math.ceil(maxIn / step) * step, botV = Math.ceil(maxOut / step) * step;
    const scale = innerH / (topV + botV);
    const y0 = padT + topV * scale;
    const y = (v) => y0 - v * scale;
    const colW = innerW / keys.length;
    const barW = Math.max(3, Math.min(18, colW * 0.36));
    let g = "";

    for (let v = -botV; v <= topV + 1; v += step) {
      const yy = y(v);
      g += `<line class="grid${v === 0 ? " grid-zero" : ""}" x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}"/>`;
      g += `<text class="axis" x="${padL - 8}" y="${yy + 4}" text-anchor="end">${v === 0 ? "0" : F().compact(Math.abs(v))}</text>`;
    }

    const pts = [];
    keys.forEach((k, i) => {
      const mo = A.M[k];
      const cx = padL + colW * (i + 0.5);
      const sel = k === selected;
      const { m } = WD.parseKey(k);
      const label = `${F().monthLong(k)}${mo.partial ? " (partial)" : ""}: in ${F().inr(mo.income)}, spent ${F().inr(mo.spend)}, invested ${F().inr(mo.invested)}, kept ${F().inr(mo.kept)}`;
      g += `<g class="cf-col${sel ? " is-sel" : ""}${mo.partial ? " is-partial" : ""}" data-key="${k}" role="radio" aria-checked="${sel}" tabindex="${sel ? 0 : -1}" aria-label="${esc(label)}" data-tip="${tip([F().monthLong(k) + (mo.partial ? " · partial" : ""), "In " + F().inr(mo.income), "Spent " + F().inr(mo.spend), "Invested " + F().inr(mo.invested), "Kept " + F().inr(mo.kept) + (mo.rate != null ? " · " + F().pct(mo.rate) : "")])}">`;
      g += `<rect class="cf-hit" x="${cx - colW / 2}" y="${padT - 6}" width="${colW}" height="${innerH + 12}" rx="6"/>`;
      g += `<rect class="cf-in" x="${cx - barW / 2}" y="${y(mo.income)}" width="${barW}" height="${Math.max(0, mo.income * scale)}" rx="2"/>`;
      g += `<rect class="cf-out" x="${cx - barW / 2}" y="${y0}" width="${barW}" height="${Math.max(0, mo.spend * scale)}" rx="2"/>`;
      g += `<rect class="cf-inv" x="${cx - barW / 2}" y="${y0 + mo.spend * scale}" width="${barW}" height="${Math.max(0, mo.invested * scale)}" rx="2"/>`;
      const showLabel = colW >= 26 || m % 3 === 0;
      if (showLabel) g += `<text class="axis cf-month" x="${cx}" y="${H - padB + 18}" text-anchor="middle">${WD.MONTH_SHORT[m].slice(0, colW >= 26 ? 3 : 1)}</text>`;
      if (m === 0 || i === 0) g += `<text class="axis cf-year" x="${cx - colW / 2 + 2}" y="${H - padB + 34}">${WD.parseKey(k).y}</text>`;
      g += `</g>`;
      pts.push([cx, y(mo.kept), mo.kept]);
    });

    const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
    g += `<path class="cf-net" d="${path}"/>`;
    pts.forEach((p, i) => { g += `<circle class="cf-dot${p[2] < 0 ? " is-neg" : ""}${keys[i] === selected ? " is-sel" : ""}" cx="${p[0]}" cy="${p[1]}" r="${keys[i] === selected ? 4.5 : 2.6}"/>`; });

    return `<svg class="chart chart-cf" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="radiogroup" aria-label="Monthly cash flow. Use arrow keys to choose a month.">${g}</svg>`;
  };

  // Spread label centres so they keep a minimum gap, staying inside [lo, hi] where room allows.
  function spread(items, lo, hi) {
    const s = items.slice().sort((a, b) => a.want - b.want);
    let edge = lo;
    for (const it of s) { it.at = Math.max(it.want, edge + it.size / 2); edge = it.at + it.size / 2; }
    edge = hi;
    for (let i = s.length - 1; i >= 0; i--) {
      const it = s[i];
      if (it.at + it.size / 2 > edge) it.at = edge - it.size / 2;
      edge = it.at - it.size / 2;
    }
    return items;
  }

  // ---------- Flow: sources -> month -> destinations ----------
  WD.chartFlow = function (mo, width) {
    const W = Math.max(340, width), nodeW = 10, gap = 8;
    let inItems = Object.entries(mo.inCats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([c, v]) => ({ id: c, label: WD.CAT[c].label, value: v, color: "var(--ink-3)" }));
    if (inItems.length > 2) {
      const keep = inItems.slice(0, 1), rest = inItems.slice(1);
      const restSum = rest.reduce((s, x) => s + x.value, 0);
      if (restSum < mo.income * 0.12) inItems = [...keep, { id: "_otherin", label: "Interest, refunds & other", value: restSum, color: "var(--ink-3)", tip: rest.map((x) => `${x.label} ${F().inr(x.value)}`) }];
    }
    const outCats = Object.entries(mo.cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const top = outCats.slice(0, 7), rest = outCats.slice(7);
    const outItems = top.map(([c, v]) => ({ id: c, label: WD.CAT[c].label, value: v, color: WD.CAT[c].color }));
    const restSum = rest.reduce((s, [, v]) => s + v, 0);
    if (restSum > 0) outItems.push({ id: "_rest", label: `${rest.length} more categor${rest.length === 1 ? "y" : "ies"}`, value: restSum, color: "oklch(0.8 0.01 160)", tip: rest.map(([c, v]) => `${WD.CAT[c].label} ${F().inr(v)}`) });
    if (mo.invested > 0) outItems.push({ id: "invest", label: "Invested", value: mo.invested, color: "var(--jade-2)" });
    const left = mo.income - mo.spend - Math.max(0, mo.invested);
    if (left > 0) outItems.push({ id: "_kept", label: "Left in account", value: left, color: "var(--jade)" });
    if (left < 0) inItems.push({ id: "_bal", label: "From your balance", value: -left, color: "var(--persimmon)" });
    const total = Math.max(inItems.reduce((s, x) => s + x.value, 0), outItems.reduce((s, x) => s + x.value, 0));
    if (!total) return `<p class="empty-note">No money moved this month.</p>`;

    const H = Math.max(300, Math.min(420, 70 + outItems.length * 34));
    const labelW = Math.min(170, W * 0.26);
    const xL = labelW, xM = W / 2 - nodeW / 2, xR = W - labelW - nodeW;
    const avail = (n) => H - 20 - gap * Math.max(0, n - 1);
    const k = Math.min(avail(inItems.length) / total, avail(outItems.length) / total);
    const midH = total * k;
    const midY = (H - midH) / 2;

    const stack = (items, x) => {
      const h = items.reduce((s, it) => s + it.value * k, 0) + gap * (items.length - 1);
      let yy = (H - h) / 2;
      return items.map((it) => { const n = { ...it, x, y: yy, h: Math.max(1.5, it.value * k) }; yy += n.h + gap; return n; });
    };
    const L = stack(inItems, xL), R = stack(outItems, xR);
    let g = "";
    const ribbon = (x1, y1a, y1b, x2, y2a, y2b, color, cls, t) => {
      const cx = (x1 + x2) / 2;
      return `<path class="flow-ribbon ${cls}" style="fill:${color}" d="M${x1},${y1a} C${cx},${y1a} ${cx},${y2a} ${x2},${y2a} L${x2},${y2b} C${cx},${y2b} ${cx},${y1b} ${x1},${y1b} Z" data-tip="${t}"/>`;
    };
    const tipFor = (n, extra) => tip([n.label, F().inr(n.value), ...(extra || []), ...(n.tip || [])]);
    let my = midY;
    L.forEach((n) => { const h = n.value * k; g += ribbon(n.x + nodeW, n.y, n.y + h, xM, my, my + h, n.color, "is-in", tipFor(n)); my += h; });
    my = midY;
    R.forEach((n) => { const h = n.value * k; g += ribbon(xM + nodeW, my, my + h, n.x, n.y, n.y + h, n.color, "is-out", tipFor(n, [F().pct(n.value / Math.max(1, mo.income), 1) + " of money in"])); my += h; });
    g += `<rect class="flow-mid" x="${xM}" y="${midY}" width="${nodeW}" height="${midH}" rx="2"/>`;

    const place = (nodes) => spread(nodes.map((n) => ({ n, want: n.y + n.h / 2, size: n.h >= 30 ? 32 : 17 })), 4, H - 4);
    place(L).forEach(({ n, at, size }) => {
      g += `<rect class="flow-node" style="fill:${n.color}" x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="2" data-tip="${tipFor(n)}"/>`;
      if (size > 20) g += `<text class="flow-label" x="${n.x - 10}" y="${at - 2}" text-anchor="end">${esc(n.label)}</text><text class="flow-value" x="${n.x - 10}" y="${at + 13}" text-anchor="end">${F().inr(n.value)}</text>`;
      else g += `<text class="flow-label" x="${n.x - 10}" y="${at + 4}" text-anchor="end">${esc(n.label)} <tspan class="flow-value">${F().compact(n.value)}</tspan></text>`;
    });
    place(R).forEach(({ n, at, size }) => {
      g += `<rect class="flow-node" style="fill:${n.color}" x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="2" data-tip="${tipFor(n)}"/>`;
      const cls = `flow-label${n.id === "_kept" ? " is-kept" : ""}`;
      if (size > 20) g += `<text class="${cls}" x="${n.x + nodeW + 10}" y="${at - 2}">${esc(n.label)}</text><text class="flow-value" x="${n.x + nodeW + 10}" y="${at + 13}">${F().inr(n.value)}</text>`;
      else g += `<text class="${cls}" x="${n.x + nodeW + 10}" y="${at + 4}">${esc(n.label)} <tspan class="flow-value">${F().compact(n.value)}</tspan></text>`;
    });
    return `<svg class="chart chart-flow" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Where money went this month">${g}</svg>`;
  };

  // ---------- Flow as a ranked list (narrow screens) ----------
  WD.chartFlowList = function (mo) {
    const inc = Math.max(1, mo.income);
    const rows = Object.entries(mo.cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
      .map(([c, v]) => ({ label: WD.CAT[c].label, value: v, color: WD.CAT[c].color }));
    if (mo.invested > 0) rows.push({ label: "Invested", value: mo.invested, color: "var(--jade-2)" });
    const left = mo.income - mo.spend - Math.max(0, mo.invested);
    if (left > 0) rows.push({ label: "Left in account", value: left, color: "var(--jade)", kept: true });
    const max = Math.max(1, ...rows.map((r) => r.value));
    let h = `<p class="flow-list-in">Money in: <b>${F().inr(mo.income)}</b>${left < 0 ? ` · <span class="neg">${F().inr(-left)} more went out than came in</span>` : ""}</p><ol class="flow-list">`;
    rows.forEach((r) => {
      h += `<li${r.kept ? ' class="is-kept"' : ""}><span class="fl-label">${esc(r.label)}</span><span class="fl-value">${F().inr(r.value)} <small>${F().pct(r.value / inc)}</small></span><span class="fl-bar"><i style="width:${(r.value / max) * 100}%;background:${r.color}"></i></span></li>`;
    });
    return h + `</ol>`;
  };

  // ---------- 12-month mini bars ----------
  WD.chartMini = function (values, selIndex, color) {
    const n = values.length, W = 112, H = 26, bw = W / n;
    const max = Math.max(1, ...values);
    let g = "";
    values.forEach((v, i) => {
      const h = Math.max(v > 0 ? 1.5 : 0.5, (v / max) * (H - 2));
      g += `<rect x="${i * bw + 1}" y="${H - h}" width="${bw - 2}" height="${h}" rx="1" class="mini${i === selIndex ? " is-sel" : ""}" ${i === selIndex ? `style="fill:${color}"` : ""}/>`;
    });
    return `<svg class="chart-mini" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${g}</svg>`;
  };

  // ---------- Cumulative spend, this year vs earlier ----------
  WD.chartCumulative = function (lines, mode, width) {
    const W = Math.max(320, width), H = 280, padL = 52, padR = 92, padT = 16, padB = 30;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const max = Math.max(1, ...lines.flatMap((l) => l.pts.filter(Boolean).map((p) => p.value)));
    const step = niceStep(max, 4), top = Math.ceil(max / step) * step;
    const x = (i) => padL + (innerW * i) / 11;
    const y = (v) => padT + innerH - (v / top) * innerH;
    const months = mode === "fy" ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let g = "";
    for (let v = 0; v <= top; v += step) {
      g += `<line class="grid" x1="${padL}" x2="${padL + innerW}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${padL - 8}" y="${y(v) + 4}" text-anchor="end">${v ? F().compact(v) : "0"}</text>`;
    }
    months.forEach((m, i) => { g += `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${WD.MONTH_SHORT[m].slice(0, 3)}</text>`; });
    const placed = [];
    lines.slice().reverse().forEach((l) => {
      const pts = l.pts.filter(Boolean);
      if (!pts.length) return;
      const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.idx).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
      const cls = l.current ? "cum-cur" : lines.indexOf(l) === 1 ? "cum-prev" : "cum-old";
      g += `<path class="cum ${cls}" d="${d}"/>`;
      pts.forEach((p) => { g += `<circle class="cum-pt ${cls}" cx="${x(p.idx)}" cy="${y(p.value)}" r="${l.current ? 3 : 2}" data-tip="${tip([l.label + " to " + WD.fmt.monthName(p.key), F().inr(p.value)])}"/>`; });
      const last = pts[pts.length - 1];
      let ly = y(last.value) + 4;
      for (const p of placed) if (Math.abs(p - ly) < 28) ly = p + (ly >= p ? 28 : -28);
      placed.push(ly);
      g += `<text class="cum-label ${cls}" x="${x(last.idx) + 10}" y="${ly - 6}">${esc(l.label)}</text><text class="cum-value ${cls}" x="${x(last.idx) + 10}" y="${ly + 9}">${F().compact(last.value)}</text>`;
    });
    return `<svg class="chart chart-cum" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cumulative spending by month compared with earlier years">${g}</svg>`;
  };

  // ---------- Daily heatmap ----------
  WD.chartHeatmap = function (daily, width) {
    let cells = daily.cells;
    if (!cells.length) return "";
    if (width < 600) cells = cells.slice(-182);
    const first = cells[0].date;
    const offset = (first.getDay() + 6) % 7;
    const weeks = Math.ceil((cells.length + offset) / 7);
    const padL = 30, padT = 20;
    const size = Math.max(9, Math.min(16, Math.floor((width - padL) / weeks) - 3));
    const gap = 3;
    const W = padL + weeks * (size + gap), H = padT + 7 * (size + gap);
    const vals = cells.map((c) => c.value).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p) => vals[Math.floor(p * (vals.length - 1))] || 0;
    const th = [q(0.2), q(0.45), q(0.7), q(0.9)];
    const level = (v) => (v <= 0 ? 0 : v <= th[0] ? 1 : v <= th[1] ? 2 : v <= th[2] ? 3 : v <= th[3] ? 4 : 5);
    let g = "";
    ["Mon", "", "Wed", "", "Fri", "", "Sun"].forEach((d, i) => { if (d) g += `<text class="axis" x="0" y="${padT + i * (size + gap) + size - 2}">${d}</text>`; });
    let lastMonth = -1;
    cells.forEach((c, i) => {
      const idx = i + offset;
      const wk = Math.floor(idx / 7), dow = idx % 7;
      const x = padL + wk * (size + gap), y = padT + dow * (size + gap);
      if (c.date.getMonth() !== lastMonth && dow <= 1) {
        lastMonth = c.date.getMonth();
        g += `<text class="axis" x="${x}" y="${padT - 7}">${WD.MONTH_SHORT[lastMonth]}</text>`;
      } else if (c.date.getDate() === 1) lastMonth = c.date.getMonth();
      const t = [WD.fmt.date(c.date), c.value > 0 ? F().inr(c.value) : "No day-to-day spending"];
      if (c.top) t.push("Largest: " + c.top.merchant + " " + F().inr(-c.top.amount));
      g += `<rect class="hm l${level(c.value)}" x="${x}" y="${y}" width="${size}" height="${size}" rx="2.5" data-tip="${tip(t)}"/>`;
    });
    return { svg: `<svg class="chart chart-hm" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Daily day-to-day spending over 12 months">${g}</svg>`, th };
  };

  // ---------- Weekday averages ----------
  WD.chartWeekday = function (weekday, width) {
    const W = Math.max(260, width), H = 190, padB = 26, padT = 22;
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const max = Math.max(1, ...weekday);
    const bw = W / 7;
    let g = "";
    weekday.forEach((v, i) => {
      const h = (v / max) * (H - padB - padT);
      const x = i * bw + bw * 0.18, w = bw * 0.64;
      g += `<rect class="wd${i >= 5 ? " is-weekend" : ""}" x="${x}" y="${H - padB - h}" width="${w}" height="${h}" rx="3" data-tip="${tip([names[i] + " average", F().inr(v)])}"/>`;
      g += `<text class="wd-value" x="${x + w / 2}" y="${H - padB - h - 6}" text-anchor="middle">${F().compact(v)}</text>`;
      g += `<text class="axis" x="${x + w / 2}" y="${H - 8}" text-anchor="middle">${names[i]}</text>`;
    });
    return `<svg class="chart chart-wd" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Average day-to-day spending by weekday">${g}</svg>`;
  };

  // ---------- Balance ----------
  WD.chartBalance = function (A, keys, selected, width, essentials) {
    const W = Math.max(320, width), H = 236, padL = 52, padR = 12, padT = 14, padB = 40;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const vals = keys.map((k) => A.M[k].closing).filter((v) => v != null);
    if (!vals.length) return `<p class="empty-note">This statement has no balance column, so the balance trend can't be drawn.</p>`;
    const mins = keys.map((k) => A.M[k].minBal).filter((v) => v != null);
    const lo = Math.min(0, ...mins), hi = Math.max(...vals, essentials * 6 || 0);
    const step = niceStep(hi - lo, 4), top = Math.ceil(hi / step) * step, bot = Math.floor(lo / step) * step;
    const x = (i) => padL + (innerW * (i + 0.5)) / keys.length;
    const y = (v) => padT + innerH - ((v - bot) / (top - bot)) * innerH;
    let g = "";
    for (let v = bot; v <= top; v += step) g += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${padL - 8}" y="${y(v) + 4}" text-anchor="end">${v ? F().compact(v) : "0"}</text>`;
    if (essentials > 0) {
      const ty = y(essentials * 6);
      g += `<line class="target" x1="${padL}" x2="${W - padR}" y1="${ty}" y2="${ty}"/><text class="target-label" x="${W - padR}" y="${ty - 6}" text-anchor="end">6 months of essentials</text>`;
    }
    keys.forEach((k, i) => {
      const mo = A.M[k];
      if (mo.minBal != null && mo.closing != null) {
        const visible = y(mo.minBal) - y(Math.max(mo.closing, mo.minBal)) > 6;
        g += `<line class="bal-range${visible ? "" : " is-hit"}" x1="${x(i)}" x2="${x(i)}" y1="${visible ? y(mo.minBal) : y(mo.closing) + 6}" y2="${visible ? y(Math.max(mo.closing, mo.minBal)) : y(mo.closing) - 6}" data-tip="${tip([WD.fmt.monthLong(k), "Closed at " + F().inr(mo.closing), "Lowest " + F().inr(mo.minBal) + (mo.minBalDate ? " on " + WD.fmt.dateShort(mo.minBalDate) : "")])}"/>`;
        if (visible) g += `<line class="bal-low" x1="${x(i) - 4}" x2="${x(i) + 4}" y1="${y(mo.minBal)}" y2="${y(mo.minBal)}"/>`;
      }
      const { m, y: yr } = WD.parseKey(k);
      const colW = innerW / keys.length;
      if (colW >= 26 || m % 3 === 0) g += `<text class="axis${k === selected ? " is-sel-label" : ""}" x="${x(i)}" y="${H - padB + 16}" text-anchor="middle">${WD.MONTH_SHORT[m].slice(0, colW >= 26 ? 3 : 1)}</text>`;
      if (m === 0 || i === 0) g += `<text class="axis cf-year" x="${x(i) - colW / 2 + 2}" y="${H - padB + 31}">${yr}</text>`;
    });
    const d = keys.map((k, i) => (A.M[k].closing == null ? "" : `${i ? "L" : "M"}${x(i).toFixed(1)},${y(A.M[k].closing).toFixed(1)}`)).join("");
    g += `<path class="bal-line" d="${d}"/>`;
    keys.forEach((k, i) => { if (A.M[k].closing != null) g += `<circle class="bal-dot${k === selected ? " is-sel" : ""}" cx="${x(i)}" cy="${y(A.M[k].closing)}" r="${k === selected ? 4.5 : 2.4}" data-tip="${tip([WD.fmt.monthLong(k), "Closed at " + F().inr(A.M[k].closing)])}"/>`; });
    return `<svg class="chart chart-bal" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Month-end balance">${g}</svg>`;
  };
})();
