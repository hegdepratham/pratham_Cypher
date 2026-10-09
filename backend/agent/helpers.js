
const round1 = (n) => Math.round(n * 10) / 10;
const round0 = (n) => Math.round(n);
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
const isWarehouse = (loc) => String(loc).startsWith('WH-');
const cheapestOf = (suppliers) =>
  [...suppliers].sort((a, b) => a.price - b.price)[0];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromStr, toStr) {
  return Math.round(
    (Date.parse(toStr) - Date.parse(fromStr)) / 86400000
  );
}

function projectRunout(stock, rate, incoming = []) {
  if (!(rate > 0)) return Infinity;

  let total = stock;
  const sorted = [...incoming].sort(
    (a, b) => a.daysUntil - b.daysUntil
  );

  for (const po of sorted) {
    if (po.daysUntil <= total / rate) {
      total += po.qty;
    } else {
      break;
    }
  }

  return total / rate;
}

function makeFinding({
  kind, severity, score, type, sku, key, details, evidence, text
}) {
  return {
    type,
    sku,
    details,
    score,
    explanation_fallback: text,
    evidence: {
      ...evidence,
      key,
      kind,
      severity,
      score: round1(score)
    }
  };
}

module.exports = {
  round0,
  round1,
  inr,
  isWarehouse,
  cheapestOf,
  todayStr,
  daysBetween,
  projectRunout,
  makeFinding
};