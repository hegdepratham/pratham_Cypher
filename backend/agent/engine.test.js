const { test } = require('node:test');
const assert = require('node:assert/strict');

const { evaluateStockout } = require('./detectors/stockout');
const { detectOverduePO } = require('./detectors/overdue');
const { detectSlowMoving } = require('./detectors/slowMoving');
const { detectDemandChange } = require('./detectors/demandChange');
const { projectRunout } = require('./helpers');

const filterSuppliers = [
  { supplier: 'HydroFlow', price: 420, lead_time_days: 7, moq: 20 },
  { supplier: 'QuickParts', price: 480, lead_time_days: 3, moq: 10 },
];
const belgaum = { location: 'Belgaum', stock: 60, rate: 8 / 7 };

test('runway counts POs that arrive in time, ignores ones that arrive too late', () => {
  assert.ok(projectRunout(8, 4, [{ qty: 200, daysUntil: 1 }]) > 50);
  assert.ok(projectRunout(8, 4, [{ qty: 200, daysUntil: 5 }]) < 3);
  assert.equal(projectRunout(8, 0), Infinity);
});

test('Gokak scenario: prefers a transfer from Belgaum over buying', () => {
  const f = evaluateStockout({ sku: 'F-101', location: 'Gokak', stock: 8, rate: 29 / 7, suppliers: filterSuppliers, donors: [belgaum] });
  assert.equal(f.type, 'transfer');
  assert.equal(f.details.from, 'Belgaum');
  assert.ok(f.details.qty > 0 && f.details.qty <= 42, 'must not strip Belgaum of its own stock');
  assert.equal(f.evidence.decision.unavoidable_gap, false);
});

test('Gokak scenario without a donor: falls back to the faster supplier and flags the gap', () => {
  const f = evaluateStockout({ sku: 'F-101', location: 'Gokak', stock: 8, rate: 29 / 7, suppliers: filterSuppliers, donors: [] });
  assert.equal(f.type, 'purchase_order');
  assert.equal(f.details.supplier, 'QuickParts');
  assert.equal(f.evidence.decision.unavoidable_gap, true);
  assert.ok(f.details.price_premium_pct > 0);
});

test('seal kit: nobody has stock, so it picks the fast supplier', () => {
  const f = evaluateStockout({
    sku: 'S-210', location: 'Bagalkot', stock: 5, rate: 15 / 7,
    suppliers: [
      { supplier: 'SealMax', price: 950, lead_time_days: 10, moq: 10 },
      { supplier: 'FastSeal', price: 1150, lead_time_days: 4, moq: 5 },
    ],
  });
  assert.equal(f.details.supplier, 'FastSeal');
  assert.equal(f.evidence.severity, 'high');
});

test('bearing: avoids the cheap supplier with MOQ 500 and flags supplier_mismatch', () => {
  const f = evaluateStockout({
    sku: 'B-520', location: 'Dharwad', stock: 12, rate: 22 / 7,
    suppliers: [
      { supplier: 'BearingCo', price: 60, lead_time_days: 14, moq: 500 },
      { supplier: 'LocalBear', price: 85, lead_time_days: 2, moq: 20 },
    ],
  });
  assert.equal(f.details.supplier, 'LocalBear');
  assert.equal(f.evidence.kind, 'supplier_mismatch');
  assert.ok(f.details.qty < 100);
});

test('every rejected option explains why', () => {
  const f = evaluateStockout({ sku: 'F-101', location: 'Gokak', stock: 8, rate: 29 / 7, suppliers: filterSuppliers, donors: [belgaum] });
  for (const o of f.evidence.options) assert.ok(o.verdict && o.verdict.length > 0);
});

test('healthy stock is NOT flagged', () => {
  const f = evaluateStockout({
    sku: 'G-701', location: 'Gokak', stock: 50, rate: 15 / 7,
    suppliers: [{ supplier: 'AutoGasket', price: 540, lead_time_days: 7, moq: 10 }],
  });
  assert.equal(f, null);
});

test('no sales means no stock-out', () => {
  assert.equal(evaluateStockout({ sku: 'X', location: 'A', stock: 0, rate: 0, suppliers: filterSuppliers }), null);
});

test('an on-time open PO covers the gap, so no finding', () => {
  const f = evaluateStockout({
    sku: 'F-101', location: 'Gokak', stock: 8, rate: 4,
    suppliers: [{ supplier: 'A', price: 100, lead_time_days: 7, moq: 1 }],
    incoming: [{ qty: 200, daysUntil: 1 }],
  });
  assert.equal(f, null);
});

test('no supplier and no donor still produces an alert (never crashes)', () => {
  const f = evaluateStockout({ sku: 'X-1', location: 'Gokak', stock: 2, rate: 3, suppliers: [], donors: [] });
  assert.equal(f.type, 'alert');
  assert.equal(f.details.action, 'find_source');
});

test('overdue PO with low cover recommends a backup supplier', () => {
  const f = detectOverduePO({
    po: { po: 'PO-1002', supplier: 'HoseWorks', sku: 'H-415', qty: 100, expected_date: '2026-10-03', status: 'overdue' },
    daysOverdue: 6, networkStock: 15, networkRate: 22 / 7,
    suppliers: [
      { supplier: 'HoseWorks', price: 1100, lead_time_days: 5, moq: 50 },
      { supplier: 'PressureLine', price: 1260, lead_time_days: 2, moq: 20 },
    ],
  });
  assert.equal(f.evidence.severity, 'high');
  assert.equal(f.details.backup_supplier, 'PressureLine');
});

test('overdue PO with lots of stock is low priority and has no backup', () => {
  const f = detectOverduePO({
    po: { po: 'PO-9', supplier: 'A', sku: 'Z', qty: 10, expected_date: '2026-10-03', status: 'overdue' },
    daysOverdue: 2, networkStock: 500, networkRate: 2,
    suppliers: [{ supplier: 'A', price: 10, lead_time_days: 5, moq: 1 }],
  });
  assert.equal(f.evidence.severity, 'low');
  assert.equal(f.details.backup_supplier, null);
});

test('slow-moving pumps are flagged, a healthy product is not', () => {
  const pumps = detectSlowMoving({
    sku: 'P-330', name: 'Main Hydraulic Pump',
    rows: [{ location: 'Belgaum', stock: 25, rate28: 2 / 28 }, { location: 'Hubli', stock: 6, rate28: 1 / 28 }],
    suppliers: [{ supplier: 'PumpKart', price: 18000, lead_time_days: 15, moq: 1 }],
  });
  assert.equal(pumps.evidence.kind, 'slow_moving');
  assert.ok(pumps.details.excess_units > 0);

  const healthy = detectSlowMoving({
    sku: 'M-903', name: 'Piston Rings',
    rows: [{ location: 'Dharwad', stock: 30, rate28: 8 / 7 }],
    suppliers: [{ supplier: 'PistonPlus', price: 1600, lead_time_days: 8, moq: 5 }],
  });
  assert.equal(healthy, null);
});

test('demand spike is detected; steady demand is not', () => {
  const suppliers = [
    { supplier: 'ValveTech', price: 2300, lead_time_days: 6, moq: 5 },
    { supplier: 'SpoolPro', price: 2650, lead_time_days: 3, moq: 5 },
  ];
  const spike = detectDemandChange({
    sku: 'V-610', location: 'Bijapur', last7: 36, prev7: 7, stock: 40,
    incoming: [{ qty: 20, daysUntil: 5 }], suppliers,
  });
  assert.equal(spike.evidence.kind, 'demand_change');
  assert.equal(spike.details.direction, 'up');
  assert.ok(spike.details.suggested_reorder_qty > 0);

  assert.equal(detectDemandChange({ sku: 'V', location: 'X', last7: 29, prev7: 29, stock: 40, suppliers }), null);
});

test('a small wobble (3 -> 6 units) is not a spike', () => {
  assert.equal(detectDemandChange({ sku: 'V', location: 'X', last7: 6, prev7: 3, stock: 40, suppliers: [] }), null);
});
