(function () {
  "use strict";
  const WD = (window.WD = window.WD || {});

  // ---------- CSV ----------
  function detectDelimiter(text) {
    const lines = text.split(/\r?\n/).slice(0, 60);
    let best = ",", bestScore = -1;
    for (const d of [",", ";", "\t", "|"]) {
      const counts = lines.map((l) => l.split(d).length - 1).filter((c) => c > 0);
      if (!counts.length) continue;
      const mode = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];
      const score = counts.filter((c) => c === mode).length * mode;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  }

  WD.parseCSV = function (text) {
    text = text.replace(/^\uFEFF/, "");
    const d = detectDelimiter(text);
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
        } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === d) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.map((r) => r.map((c) => c.trim()));
  };

  // ---------- Values ----------
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
  const y4 = (y) => { y = +y; return y < 100 ? 2000 + y : y; };
  const mk = (y, m, d) => {
    const dt = new Date(y, m, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
    if (y < 1990 || y > 2100) return null;
    return dt;
  };

  function parseDate(v, order) {
    if (v == null || v === "") return null;
    if (typeof v === "number") {
      if (v > 20000 && v < 80000) {
        const ms = Date.UTC(1899, 11, 30) + Math.round(v) * 864e5;
        const u = new Date(ms);
        return mk(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
      }
      return null;
    }
    const s = String(v).trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?$/i, "");
    let m;
    if ((m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/))) return mk(+m[1], +m[2] - 1, +m[3]);
    if ((m = s.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})$/))) {
      return order === "mdy" ? mk(y4(m[3]), +m[1] - 1, +m[2]) : mk(y4(m[3]), +m[2] - 1, +m[1]);
    }
    if ((m = s.match(/^(\d{1,2})[\/\-. ]([A-Za-z]{3,9})[\/\-. ,]*(\d{2,4})$/))) {
      const mo = MONTHS[m[2].toLowerCase().slice(0, m[2].length >= 4 && m[2].toLowerCase().startsWith("sept") ? 4 : 3)];
      return mo == null ? null : mk(y4(m[3]), mo, +m[1]);
    }
    if ((m = s.match(/^([A-Za-z]{3,9})[ \-](\d{1,2}),?[ \-](\d{2,4})$/))) {
      const mo = MONTHS[m[1].toLowerCase().slice(0, 3)];
      return mo == null ? null : mk(y4(m[3]), mo, +m[2]);
    }
    return null;
  }

  function detectDateOrder(values) {
    let dmy = 0, mdy = 0;
    for (const v of values) {
      const m = String(v ?? "").trim().match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})/);
      if (!m) continue;
      if (+m[1] > 12) dmy++;
      if (+m[2] > 12) mdy++;
    }
    return mdy > dmy ? "mdy" : "dmy";
  }

  // Returns {value, side} where side is "dr" | "cr" | null when the text carried a marker.
  function parseAmount(v) {
    if (v == null || v === "") return { value: NaN, side: null };
    if (typeof v === "number") return { value: v, side: null };
    let s = String(v).trim();
    let side = null;
    if (/\b(dr|debit)\.?$/i.test(s)) side = "dr";
    else if (/\b(cr|credit)\.?$/i.test(s)) side = "cr";
    let neg = false;
    if (/^\(.*\)$/.test(s)) neg = true;
    if (/-\s*$/.test(s) && !/^-/.test(s)) neg = true;
    s = s.replace(/(dr|cr|debit|credit|inr|rs\.?|₹)/gi, "").replace(/[,\s()]/g, "");
    if (/^-/.test(s)) { neg = true; s = s.slice(1); }
    s = s.replace(/-$/, "");
    if (s === "" || s === "-") return { value: NaN, side };
    const n = parseFloat(s);
    if (!isFinite(n)) return { value: NaN, side };
    return { value: neg ? -n : n, side };
  }

  // ---------- Header detection ----------
  const FIELDS = ["date", "narration", "debit", "credit", "amount", "type", "balance"];
  WD.FIELD_LABELS = {
    date: "Date", narration: "Description", debit: "Money out (debit)", credit: "Money in (credit)",
    amount: "Amount (single column)", type: "Dr/Cr marker", balance: "Balance",
  };

  function classifyHeader(h) {
    const s = String(h || "").toLowerCase().replace(/[._]/g, " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    if (/^(dr ?\/ ?cr|cr ?\/ ?dr|d ?\/ ?c|c ?\/ ?d|type|txn type|transaction type|debit ?\/ ?credit|cr\/dr indicator)$/.test(s)) return "type";
    if (/value date|value dt/.test(s)) return "valueDate";
    if (/^(s ?no|sl ?no|sr ?no|serial)/.test(s)) return null;
    if (/(^|\b)(txn|tran|transaction|posting|post|book|booking)? ?(date|dt)$/.test(s) || s === "date") return "date";
    if (/balance|^bal\b|closing bal/.test(s)) return "balance";
    if (/withdraw|debit|^dr\b|dr amount|amount dr|paid out|money out|outflow/.test(s)) return "debit";
    if (/deposit|credit|^cr\b|cr amount|amount cr|paid in|money in|inflow/.test(s)) return "credit";
    if (/narration|description|particulars|details|remarks|naration|transaction remarks|^memo/.test(s)) return "narration";
    if (/^amount|txn amount|transaction amount|^amt\b|amount \(inr\)|amount\(inr\)|amount in/.test(s)) return "amount";
    if (/ref|chq|cheque/.test(s)) return "ref";
    return null;
  }

  function detectHeader(rows) {
    let best = null;
    const limit = Math.min(rows.length, 80);
    for (let i = 0; i < limit; i++) {
      const map = {};
      rows[i].forEach((cell, c) => {
        const f = classifyHeader(cell);
        if (f && map[f] == null) map[f] = c;
      });
      const hasMoney = (map.debit != null && map.credit != null) || map.amount != null || map.debit != null || map.credit != null;
      if (map.date == null || !hasMoney) continue;
      const score = Object.keys(map).length + (map.narration != null ? 2 : 0) + (map.balance != null ? 1 : 0);
      if (!best || score > best.score) best = { row: i, map, score };
    }
    return best;
  }

  function guessByContent(rows) {
    // No header row: find the column that parses as dates, numeric columns, and the longest text column.
    const sample = rows.slice(0, 200);
    const width = Math.max(...sample.map((r) => r.length));
    const stats = [];
    for (let c = 0; c < width; c++) {
      let dates = 0, nums = 0, textLen = 0;
      for (const r of sample) {
        const v = r[c];
        if (parseDate(v, "dmy")) dates++;
        else if (isFinite(parseAmount(v).value)) nums++;
        else if (v) textLen += String(v).length;
      }
      stats.push({ c, dates, nums, textLen });
    }
    const date = stats.slice().sort((a, b) => b.dates - a.dates)[0];
    if (!date || date.dates < 3) return null;
    const narr = stats.filter((s) => s.c !== date.c).sort((a, b) => b.textLen - a.textLen)[0];
    const numCols = stats.filter((s) => s.c !== date.c && s.nums > sample.length * 0.3).map((s) => s.c);
    const map = { date: date.c };
    if (narr) map.narration = narr.c;
    if (numCols.length >= 3) { map.debit = numCols[0]; map.credit = numCols[1]; map.balance = numCols[numCols.length - 1]; }
    else if (numCols.length === 2) { map.amount = numCols[0]; map.balance = numCols[1]; }
    else if (numCols.length === 1) map.amount = numCols[0];
    return { row: -1, map, score: 0 };
  }

  // ---------- Extraction ----------
  WD.extract = function (rows, headerRow, map) {
    const body = rows.slice(headerRow + 1);
    const order = detectDateOrder(body.map((r) => r[map.date]));
    const out = [];
    let skipped = 0;
    for (const r of body) {
      const date = parseDate(r[map.date], order);
      const narration = map.narration != null ? String(r[map.narration] ?? "").trim() : "";
      if (!date) {
        const blankMoney = ["debit", "credit", "amount"].every((f) => map[f] == null || r[map[f]] === "" || r[map[f]] == null);
        if (narration && blankMoney && out.length && !/^\*+$/.test(narration)) out[out.length - 1].narration += " " + narration;
        else if (r.some((c) => c !== "" && c != null)) skipped++;
        continue;
      }
      let amount = NaN, side = null;
      if (map.debit != null || map.credit != null) {
        const d = map.debit != null ? parseAmount(r[map.debit]) : { value: NaN };
        const c = map.credit != null ? parseAmount(r[map.credit]) : { value: NaN };
        const dv = isFinite(d.value) ? Math.abs(d.value) : 0;
        const cv = isFinite(c.value) ? Math.abs(c.value) : 0;
        if (map.debit != null && map.credit != null) amount = cv - dv;
        else if (map.debit != null) amount = d.side === "cr" ? dv : -dv;
        else amount = c.side === "dr" ? -cv : cv;
        if (!dv && !cv && map.amount != null) amount = NaN;
      }
      if (!isFinite(amount) && map.amount != null) {
        const a = parseAmount(r[map.amount]);
        amount = a.value;
        side = a.side;
        if (map.type != null) {
          const t = String(r[map.type] || "").trim().toLowerCase();
          if (/^(d|dr|debit|withdraw)/.test(t)) side = "dr";
          else if (/^(c|cr|credit|deposit)/.test(t)) side = "cr";
        }
        if (side === "dr") amount = -Math.abs(amount);
        else if (side === "cr") amount = Math.abs(amount);
      }
      let balance = NaN;
      if (map.balance != null) {
        const b = parseAmount(r[map.balance]);
        balance = b.side === "dr" ? -Math.abs(b.value) : b.value;
      }
      if (!isFinite(amount) || amount === 0) { skipped++; continue; }
      out.push({ date, narration: narration || "(no description)", amount: Math.round(amount * 100) / 100, balance: isFinite(balance) ? balance : null, unsigned: map.amount != null && side == null && map.type == null });
    }

    // Single unsigned amount column: infer direction from the running balance.
    if (out.length && out.every((t) => t.unsigned) && out.every((t) => t.amount > 0) && out.some((t) => t.balance != null)) {
      for (let i = 1; i < out.length; i++) {
        const prev = out[i - 1].balance, cur = out[i].balance;
        if (prev != null && cur != null && Math.abs(prev - out[i].amount - cur) < 0.6) out[i].amount = -out[i].amount;
      }
    }
    out.forEach((t) => delete t.unsigned);
    return { txns: out, skipped, order };
  };

  WD.analyseRows = function (rows) {
    rows = rows.filter((r) => r.some((c) => c !== "" && c != null));
    const det = detectHeader(rows) || guessByContent(rows);
    if (!det) return { rows, headerRow: -1, map: {}, headers: [], ok: false };
    const width = Math.max(...rows.slice(Math.max(0, det.row), det.row + 30).map((r) => r.length));
    const headers = [];
    for (let c = 0; c < width; c++) headers.push(det.row >= 0 ? String(rows[det.row][c] ?? "").trim() || `Column ${c + 1}` : `Column ${c + 1}`);
    const map = {};
    FIELDS.forEach((f) => { if (det.map[f] != null) map[f] = det.map[f]; });
    if (map.debit != null && map.credit != null) delete map.amount;
    return { rows, headerRow: det.row, map, headers, ok: true };
  };

  WD.detectBank = function (rows) {
    const head = rows.slice(0, 25).map((r) => r.join(" ")).join(" ").toUpperCase();
    const banks = [["HDFC BANK", "HDFC Bank"], ["ICICI", "ICICI Bank"], ["STATE BANK", "SBI"], ["SBI", "SBI"], ["AXIS", "Axis Bank"], ["KOTAK", "Kotak"], ["YES BANK", "Yes Bank"], ["IDFC", "IDFC First"], ["INDUSIND", "IndusInd"], ["FEDERAL", "Federal Bank"], ["CANARA", "Canara Bank"], ["BANK OF BARODA", "Bank of Baroda"], ["PUNJAB NATIONAL", "PNB"], ["UNION BANK", "Union Bank"]];
    for (const [k, v] of banks) if (head.includes(k)) return v;
    return null;
  };

  // ---------- Files ----------
  WD.readStatementFile = function (file) {
    return new Promise((resolve, reject) => {
      const name = file.name || "statement";
      const ext = name.split(".").pop().toLowerCase();
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Couldn't read ${name}.`));
      if (ext === "xls" || ext === "xlsx" || ext === "xlsm" || ext === "ods") {
        if (!window.XLSX) return reject(new Error("The Excel reader (vendor/xlsx.full.min.js) didn't load. Export the statement as CSV instead."));
        reader.onload = () => {
          try {
            const wb = window.XLSX.read(new Uint8Array(reader.result), { type: "array", cellDates: false, raw: false });
            let best = null;
            for (const sn of wb.SheetNames) {
              const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: "", blankrows: false })
                .map((r) => r.map((c) => (typeof c === "string" ? c.trim() : c)));
              const a = WD.analyseRows(rows);
              const score = a.ok ? a.rows.length - a.headerRow : 0;
              if (!best || score > best.score) best = { ...a, score, sheet: sn };
            }
            resolve({ name, ...best, bank: WD.detectBank(best.rows) });
          } catch (e) {
            reject(new Error(`${name} doesn't look like a readable Excel file. If it's password-protected, open it and re-save without a password.`));
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = () => {
          const text = String(reader.result || "");
          if (/^%PDF/.test(text)) return reject(new Error(`${name} is a PDF. Download the CSV or Excel version from netbanking instead.`));
          const rows = WD.parseCSV(text);
          resolve({ name, ...WD.analyseRows(rows), bank: WD.detectBank(rows) });
        };
        reader.readAsText(file);
      }
    });
  };

  WD.parseDate = parseDate;
  WD.parseAmount = parseAmount;
  WD.FIELDS = FIELDS;
})();
