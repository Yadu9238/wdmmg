const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(__dirname, "..", "assets", "categorize.js"), "utf8"), context);
const WD = context.window.WD;
const categorize = (narration, amount = -500, overrides = {}) =>
  WD.categorize([{ narration, amount }], overrides)[0];

test("AUTOPAY does not affect merchant names or rule keys", () => {
  const pairs = [
    ["AUTOPAY NETFLIX", "NETFLIX"],
    ["UPI/AUTOPAY/123456789012/NETFLIX/netflix@ybl", "UPI/123456789012/NETFLIX/netflix@ybl"],
    ["UPI/DR/123456789012/AUTOPAY/NETFLIX/netflix@ybl", "UPI/DR/123456789012/NETFLIX/netflix@ybl"],
    ["ACH D- AUTOPAY-INDIAN CLEARING CORP-ZERODHA SIP-123456789012", "ACH D- INDIAN CLEARING CORP-ZERODHA SIP-123456789012"],
    ["NEFT DR-HDFC0000001-AUTOPAY-NETFLIX-123456789012", "NEFT DR-HDFC0000001-NETFLIX-123456789012"],
    ["POS 4XXXXXXXXXXX3812 SPOTIFY INDIA AUTOPAY", "POS 4XXXXXXXXXXX3812 SPOTIFY INDIA"],
    ["AUTO PAY NETFLIX", "NETFLIX"],
    ["AUTO-PAY NETFLIX", "NETFLIX"],
  ];
  for (const [autopay, plain] of pairs) {
    const a = categorize(autopay), b = categorize(plain);
    assert.equal(a.merchant, b.merchant, autopay);
    assert.equal(WD.overrideKey(a), WD.overrideKey(b), autopay);
    assert.equal(a.cat, b.cat, autopay);
    assert.equal(a.narration, autopay, "Original narration is preserved");
  }
});

test("category overrides apply to the actual merchant, not every autopay", () => {
  const netflix = categorize("UPI/AUTOPAY/123456789012/NETFLIX/netflix@ybl");
  const overrides = { [WD.overrideKey(netflix)]: "other" };
  assert.equal(categorize("UPI/223456789012/NETFLIX/netflix@ybl", -500, overrides).cat, "other");
  assert.equal(categorize("AUTOPAY ZERODHA SIP", -500, overrides).cat, "invest");
  assert.equal(categorize("AUTOPAY SPOTIFY INDIA", -500, overrides).cat, "subscriptions");
  assert.equal(categorize("AUTOPAY BESCOM ELECTRICITY", -500, overrides).cat, "bills");
  assert.equal(categorize("UPI/AUTOPAY/123456789012/NETFLIX/netflix@ybl", 500, overrides).cat, "other_in");
});

test("old generic autopay overrides do not affect corrected merchant names", () => {
  const overrides = { "out:AUTOPAY": "invest", "out:AUTOPAY NETFLIX": "invest" };
  const t = categorize("UPI/AUTOPAY/123456789012/NETFLIX/netflix@ybl", -500, overrides);
  assert.equal(t.cat, "subscriptions");
  assert.equal(t.how, "rule");
});

test("autopays without payees do not share Unknown category overrides", () => {
  const a = categorize("AUTOPAY/123456789012");
  const b = categorize("AUTOPAY/223456789012");
  assert.equal(a.merchant, "Unknown");
  assert.equal(b.merchant, "Unknown");
  assert.notEqual(WD.overrideKey(a), WD.overrideKey(b));
  const overrides = { [WD.overrideKey(a)]: "invest", "out:UNKNOWN": "invest" };
  assert.equal(categorize(b.narration, -500, overrides).cat, "other");
  assert.equal(categorize(a.narration, -500, overrides).cat, "invest");
});

test("autopay remains a channel marker, while normal categorisation is preserved", () => {
  assert.equal(categorize("AUTOPAY NETFLIX").channel, "Auto-debit");
  assert.equal(categorize("UPI/AUTOPAY/123456789012/NETFLIX").channel, "UPI");
  for (const [narration, amount, cat] of [
    ["NEFT CR-ACME SALARY", 100000, "salary"],
    ["UPI-SWIGGY-swiggy@ybl", -500, "food"],
    ["POS SPOTIFY INDIA", -139, "subscriptions"],
    ["NEFT OWN ACCOUNT TRANSFER", -500, "transfer"],
    ["UPI-ARJUN MENON-arjun@ybl-SPLIT", 500, "other_in"],
  ]) {
    assert.equal(categorize(narration, amount).cat, cat);
  }
});

test("individual reimbursements override a friend's broad rule and survive reordering", () => {
  const make = () => [
    { date: new Date(2026, 8, 1), narration: "UPI-SWIGGY-dinner", amount: -3000, balance: 10000 },
    { date: new Date(2026, 8, 2), narration: "UPI-ARJUN MENON-arjun@ybl-DINNER", amount: 2000, balance: 12000 },
    { date: new Date(2026, 8, 3), narration: "UPI-ARJUN MENON-arjun@ybl-MOVIES", amount: 500, balance: 12500 },
    { date: new Date(2026, 8, 4), narration: "UPI-ARJUN MENON-arjun@ybl-TRAVEL", amount: 1000, balance: 13500 },
    { date: new Date(2026, 8, 5), narration: "UPI-ARJUN MENON-arjun@ybl", amount: -500, balance: 13000 },
  ];
  const txns = WD.categorize(make(), {});
  let overrides = WD.withCategoryOverride({}, txns[1], "food", "merchant");
  overrides = WD.withCategoryOverride(overrides, txns[2], "entertainment", "transaction");
  overrides = WD.withCategoryOverride(overrides, txns[3], "travel", "transaction");
  const persisted = JSON.parse(JSON.stringify(overrides));
  const fresh = WD.categorize(make().reverse(), persisted).reverse();
  assert.deepEqual(Array.from(fresh, (t) => t.cat), ["food", "food", "entertainment", "travel", "upi_other"]);
  assert.equal(WD.overrideKey(fresh[1]), WD.overrideKey(fresh[2]));
  assert.notEqual(WD.transactionOverrideKey(fresh[1]), WD.transactionOverrideKey(fresh[2]));

  const updated = WD.withCategoryOverride(persisted, fresh[2], "other_in", "merchant");
  WD.categorize(fresh, updated);
  assert.equal(fresh[1].cat, "other_in");
  assert.equal(fresh[2].cat, "other_in");
  assert.equal(fresh[3].cat, "travel", "Other individual choices are preserved");

  WD.categorize(fresh, persisted);
  vm.runInContext(readFileSync(path.join(__dirname, "..", "assets", "analyze.js"), "utf8"), context);
  const mo = WD.analyze(fresh).M["2026-09"];
  assert.equal(mo.cats.food, 1000);
  assert.equal(mo.income, 0, "Expense reimbursements do not inflate income");
  assert.equal(mo.spend, 0, "3000 + 500 out minus 3500 reimbursed");
});

test("a single choice works without a merchant rule; undo restores previous categories", () => {
  const txns = WD.categorize([
    { date: new Date(2026, 8, 1), narration: "UPI-ARJUN MENON-DINNER", amount: 2000 },
    { date: new Date(2026, 8, 2), narration: "UPI-ARJUN MENON-MOVIES", amount: 500 },
  ], {});
  const before = {};
  const next = WD.withCategoryOverride(before, txns[0], "food", "transaction");
  WD.categorize(txns, next);
  assert.equal(txns[0].cat, "food");
  assert.equal(txns[1].cat, "other_in");
  assert.equal(Object.keys(before).length, 0);
  WD.categorize(txns, before);
  assert.equal(txns[0].cat, "other_in");
});
