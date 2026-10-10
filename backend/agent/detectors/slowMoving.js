const C = require('../config');
const { round0, inr, cheapestOf, makeFinding } = require('../helpers');

function detectSlowMoving({ sku, name, rows, suppliers = [] }) {
  const cheapest = cheapestOf(suppliers);
  const totalStock = rows.reduce((s, r) => s + r.stock, 0);
  const totalRate = rows.reduce((s, r) => s + r.rate28, 0);
  if (!cheapest || totalStock <= 0) return null;

  const coverDays = totalRate > 0 ? totalStock / totalRate : null;
  const value = totalStock * cheapest.price;
  const slow = coverDays === null || coverDays > C.SLOW_COVER_DAYS;
  if (!slow || value < C.SLOW_MIN_VALUE) return null;

  const keepUnits = Math.ceil(totalRate * C.SLOW_KEEP_DAYS);
  const excessUnits = Math.max(0, totalStock - keepUnits);
  const excessValue = excessUnits * cheapest.price;
  const cashFreed = excessValue * C.CLEARANCE_RECOVERY;
  const severity = value >= 100000 ? 'medium' : 'low';
  const score = 20 + Math.min(value / 20000, 30);
  const coverText = coverDays === null ? 'no sales in 28 days' : `~${round0(coverDays)} days of cover`;
  const where = rows.filter((r) => r.stock > 0).map((r) => ({ location: r.location, stock: r.stock }));

  const options = [
    { label: 'Hold everything', detail: `${inr(value)} stays tied up (${coverText}).`, recommended: false },
    {
      label: `Clear ${excessUnits} excess units`,
      detail: `Keep ${keepUnits} units (${C.SLOW_KEEP_DAYS} days of cover). At an assumed ${C.CLEARANCE_RECOVERY * 100}% recovery this frees ~${inr(cashFreed)}.`,
      recommended: true,
    },
  ];

  return makeFinding({
    kind: 'slow_moving', severity, score, type: 'alert', sku, key: `slow:${sku}`,
    details: {
      action: 'clearance_review', stop_reordering: true,
      excess_units: excessUnits, keep_units: keepUnits,
      excess_value: round0(excessValue), est_cash_freed: round0(cashFreed),
    },
    evidence: {
      total_stock: totalStock, stock_value: round0(value),
      cover_days: coverDays === null ? null : round0(coverDays),
      locations: where, options,
      assumptions: { unit_cost_basis: `cheapest supplier price (${cheapest.supplier})`, clearance_recovery: C.CLEARANCE_RECOVERY },
      decision: { chosen: options[1].label, reason: `Excess stock beyond ${C.SLOW_KEEP_DAYS} days of cover is worth ${inr(excessValue)}.` },
    },
    text: `${name || sku}: ${totalStock} units worth ${inr(value)} with ${coverText}. Stop reordering and review clearing ${excessUnits} excess units to free about ${inr(cashFreed)}.`,
  });
}

module.exports = { detectSlowMoving };
