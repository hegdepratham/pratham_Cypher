
const { todayStr, daysBetween } = require('./helpers');

function loadSnapshot(db) {
  const today = todayStr();

  const products = Object.fromEntries(
    db.prepare('SELECT * FROM products').all().map((p) => [p.sku, p])
  );

  const inventory = db.prepare(
    'SELECT sku, location, stock FROM inventory'
  ).all();

  const salesRows = db.prepare(`
    SELECT sku, location,
      SUM(CASE WHEN date >= date('now','-7 days')
          THEN qty_sold ELSE 0 END) AS last7,
      SUM(CASE WHEN date >= date('now','-14 days')
          AND date < date('now','-7 days')
          THEN qty_sold ELSE 0 END) AS prev7,
      SUM(qty_sold) AS last28
    FROM sales
    WHERE date >= date('now','-28 days')
    GROUP BY sku, location
  `).all();

  const salesByKey = new Map(
    salesRows.map((r) => [`${r.sku}|${r.location}`, r])
  );

  const metrics = inventory.map((row) => {
    const s = salesByKey.get(`${row.sku}|${row.location}`) ||
      { last7: 0, prev7: 0, last28: 0 };

    return {
      sku: row.sku,
      location: row.location,
      stock: row.stock,
      last7: s.last7,
      prev7: s.prev7,
      last28: s.last28,
      rate7: s.last7 / 7,
      rate28: s.last28 / 28
    };
  });

  const suppliersBySku = {};

  for (const s of db.prepare('SELECT * FROM suppliers').all()) {
    (suppliersBySku[s.sku] = suppliersBySku[s.sku] || []).push(s);
  }

  const openPOs = db.prepare(
    "SELECT * FROM purchase_orders WHERE status != 'received'"
  ).all().map((p) => ({
    ...p,
    daysUntil: daysBetween(today, p.expected_date)
  }));

  const incomingBySku = {};

  for (const p of openPOs) {
    if (p.status === 'overdue' || p.daysUntil < 0) continue;

    (incomingBySku[p.sku] = incomingBySku[p.sku] || []).push({
      po: p.po,
      supplier: p.supplier,
      qty: p.qty,
      daysUntil: p.daysUntil
    });
  }

  return {
    today,
    products,
    metrics,
    suppliersBySku,
    openPOs,
    incomingBySku
  };
}

module.exports = { loadSnapshot };