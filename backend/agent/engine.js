const C = require('./config');
const { loadSnapshot } = require('./snapshot');
const { isWarehouse } = require('./helpers');
const { evaluateStockout } = require('./detectors/stockout');
const { detectOverduePO } = require('./detectors/overdue');
const { detectSlowMoving } = require('./detectors/slowMoving');
const { detectDemandChange } = require('./detectors/demandChange');

function analyze(db, { decided = [] } = {}) {
  const snap = loadSnapshot(db);
  const findings = [];

  function add(finding) {
    if (!finding) return;
    const product = snap.products[finding.sku] || { name: finding.sku, machine_model: null };
    finding.evidence.product = { name: product.name, machine_model: product.machine_model };
    findings.push(finding);
  }

  for (const m of snap.metrics) {
    if (isWarehouse(m.location)) continue;
    const suppliers = snap.suppliersBySku[m.sku] || [];
    const incoming = snap.incomingBySku[m.sku] || [];
    const donors = snap.metrics
      .filter((d) => d.sku === m.sku && d.location !== m.location)
      .map((d) => ({ location: d.location, stock: d.stock, rate: d.rate7 }));

    add(evaluateStockout({ sku: m.sku, location: m.location, stock: m.stock, rate: m.rate7, suppliers, donors, incoming }));
    add(detectDemandChange({ sku: m.sku, location: m.location, last7: m.last7, prev7: m.prev7, stock: m.stock, incoming, suppliers }));
  }

  for (const po of snap.openPOs) {
    const rows = snap.metrics.filter((m) => m.sku === po.sku);
    add(detectOverduePO({
      po,
      daysOverdue: Math.max(0, -po.daysUntil),
      networkStock: rows.reduce((s, r) => s + r.stock, 0),
      networkRate: rows.reduce((s, r) => s + r.rate7, 0),
      suppliers: snap.suppliersBySku[po.sku] || [],
    }));
  }

  for (const sku of new Set(snap.metrics.map((m) => m.sku))) {
    add(detectSlowMoving({
      sku,
      name: (snap.products[sku] || {}).name,
      rows: snap.metrics.filter((m) => m.sku === sku).map((m) => ({ location: m.location, stock: m.stock, rate28: m.rate28 })),
      suppliers: snap.suppliersBySku[sku] || [],
    }));
  }

  return rankFindings(dropRecentlyDecided(findings, decided));
}

function dropRecentlyDecided(findings, decided, now = Date.now()) {
  const cutoff = now - C.DECIDED_MEMORY_HOURS * 3600 * 1000;
  const recentKeys = new Set(
    decided
      .filter((a) => Date.parse(String(a.created_at).replace(' ', 'T') + 'Z') >= cutoff)
      .map((a) => a.evidence && a.evidence.key)
  );
  return findings.filter((f) => !recentKeys.has(f.evidence.key));
}

function rankFindings(findings) {
  const sorted = [...findings].sort((a, b) => b.score - a.score);
  sorted.forEach((f, i) => {
    f.evidence.rank = i + 1;
    f.evidence.top3 = i < 3;
  });
  return sorted;
}

module.exports = { analyze, dropRecentlyDecided, rankFindings };
