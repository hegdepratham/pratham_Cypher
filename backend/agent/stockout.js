
const config = require('../config');
const { makeFinding, round1 } = require('../helpers');

function detectStockout(snapshot) {
  const findings = [];

  for (const m of snapshot.metrics) {
    const product = snapshot.products[m.sku];
    if (!product) continue;

    const incoming = snapshot.incomingBySku[m.sku] || [];
    const incomingQty = incoming.reduce((sum, p) => sum + p.qty, 0);
    const dailyRate = m.rate7 > 0 ? m.rate7 : m.rate28;

    if (dailyRate <= 0) continue;

    const effectiveStock = m.stock + incomingQty;
    const coverDays = effectiveStock / dailyRate;

    if (coverDays > config.COVER_DAYS) continue;

    const needed = Math.max(
      0,
      Math.ceil(dailyRate * config.COVER_DAYS - effectiveStock)
    );

    findings.push(
      makeFinding({
        type: 'purchase_order',
        kind: 'stockout_risk',
        severity: coverDays <= 3 ? 'high' : 'medium',
        sku: m.sku,
        location: m.location,
        title: `${m.sku} stock-out risk at ${m.location}`,
        score: Math.max(0, Math.round(100 - coverDays * 5)),
        explanation:
          `Current stock is ${m.stock} units with approximately ${round1(coverDays)} days of cover.`,
        details: {
          stock: m.stock,
          dailyRate: round1(dailyRate),
          coverDays: round1(coverDays),
          incomingQty,
          suggestedOrderQty: needed
        },
        evidence: {
          stock: m.stock,
          last7: m.last7,
          prev7: m.prev7,
          incomingQty
        }
      })
    );
  }

  return findings;
}

module.exports = { detectStockout };