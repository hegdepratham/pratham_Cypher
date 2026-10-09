require('dotenv').config();

const db = require('./index');

// ---------- Helpers ----------
const today = new Date();

function dateOffset(n) {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Generates realistic daily sales variation.
const steady = (base) => (i) =>
  Math.max(0, base + [0, 1, 0, -1, 0, 0, 1][i % 7]);

// Generates occasional sales for slow-moving products.
const sparse = (everyN) => (i) => (i % everyN === 0 ? 1 : 0);

// ---------- Products ----------
const products = [
  ['F-101', 'Return Line Filter', 'JCB 3DX', 'Filters'],
  ['F-102', 'Engine Oil Filter', 'JCB 3DX', 'Filters'],
  ['S-210', 'Boom Cylinder Seal Kit', 'Hitachi EX200', 'Seals'],
  ['P-330', 'Main Hydraulic Pump', 'Hitachi EX200', 'Pumps'],
  ['H-415', 'High-Pressure Hose Assembly', 'JCB 3DX', 'Hoses'],
  ['B-520', 'Swing Bearing 6205', 'Universal', 'Bearings'],
  ['V-610', 'Control Valve Spool', 'Komatsu PC200', 'Valves'],
  ['G-701', 'Head Gasket Set', 'Cummins 6BT', 'Gaskets'],
  ['O-802', 'Hydraulic Oil 20L', 'Universal', 'Fluids'],
  ['M-903', 'Piston Ring Set', 'Cummins 6BT', 'Engine'],
];

// ---------- Inventory ----------
// Format: [SKU, location, stock]
const inventory = [
  ['F-101', 'Gokak', 8],
  ['F-101', 'Belgaum', 60],
  ['F-102', 'Gokak', 30],
  ['F-102', 'Belgaum', 20],
  ['F-102', 'WH-Belgaum', 80],
  ['S-210', 'Bagalkot', 5],
  ['S-210', 'Belgaum', 0],
  ['P-330', 'Belgaum', 25],
  ['P-330', 'Hubli', 6],
  ['H-415', 'Hubli', 15],
  ['B-520', 'Dharwad', 12],
  ['V-610', 'Bijapur', 40],
  ['V-610', 'Belgaum', 10],
  ['G-701', 'Gokak', 50],
  ['G-701', 'Hubli', 40],
  ['G-701', 'WH-Hubli', 120],
  ['O-802', 'Belgaum', 80],
  ['O-802', 'WH-Belgaum', 200],
  ['M-903', 'Dharwad', 30],
  ['M-903', 'WH-Hubli', 60],
];
// ---------- Sales Patterns ----------
// [sku, location, dailyQtyFunction(daysAgo)] -- generates 28 days of history
const salesPatterns = [
  ['F-101', 'Gokak', steady(4)],
  ['F-101', 'Belgaum', steady(1)],
  ['F-102', 'Gokak', steady(2)],
  ['F-102', 'Belgaum', steady(1)],
  ['S-210', 'Bagalkot', steady(2)],
  ['P-330', 'Belgaum', sparse(14)],
  ['P-330', 'Hubli', sparse(21)],
  ['H-415', 'Hubli', steady(3)],
  ['B-520', 'Dharwad', steady(3)],
  ['V-610', 'Bijapur', (i) => (i <= 7 ? steady(5)(i) : 1)],
  ['V-610', 'Belgaum', steady(1)],
  ['G-701', 'Gokak', steady(2)],
  ['G-701', 'Hubli', steady(2)],
  ['O-802', 'Belgaum', steady(4)],
  ['M-903', 'Dharwad', steady(1)],
];

// [supplier, sku, price(INR), lead_time_days, moq]
const suppliers = [
  ['HydroFlow', 'F-101', 420, 7, 20],
  ['QuickParts', 'F-101', 480, 3, 10],
  ['HydroFlow', 'F-102', 310, 7, 20],
  ['SealMax', 'S-210', 950, 10, 10],
  ['FastSeal', 'S-210', 1150, 4, 5],
  ['PumpKart', 'P-330', 18000, 15, 1],
  ['HoseWorks', 'H-415', 1100, 5, 50],
  ['PressureLine', 'H-415', 1260, 2, 20],
  ['BearingCo', 'B-520', 60, 14, 500],
  ['LocalBear', 'B-520', 85, 2, 20],
  ['ValveTech', 'V-610', 2300, 6, 5],
  ['SpoolPro', 'V-610', 2650, 3, 5],
  ['AutoGasket', 'G-701', 540, 7, 10],
  ['LubeLine', 'O-802', 2100, 4, 10],
  ['PistonPlus', 'M-903', 1600, 8, 5],
];

// [po, supplier, sku, qty, expected_date, status]
const purchaseOrders = [
  ['PO-1001', 'HydroFlow', 'F-102', 100, dateOffset(3), 'open'],
  ['PO-1002', 'HoseWorks', 'H-415', 100, dateOffset(-6), 'overdue'],
  ['PO-1003', 'ValveTech', 'V-610', 20, dateOffset(5), 'open'],
  ['PO-1004', 'AutoGasket', 'G-701', 60, dateOffset(-20), 'received'],
];
// ---------- Loading ----------
function insertAll() {
  const insProduct = db.prepare(
    'INSERT INTO products (sku, name, machine_model, category) VALUES (?, ?, ?, ?)'
  );

  const insInv = db.prepare(
    'INSERT INTO inventory (sku, location, stock) VALUES (?, ?, ?)'
  );

  const insSale = db.prepare(
    'INSERT INTO sales (date, sku, location, qty_sold) VALUES (?, ?, ?, ?)'
  );

  const insSup = db.prepare(
    'INSERT INTO suppliers (supplier, sku, price, lead_time_days, moq) VALUES (?, ?, ?, ?, ?)'
  );

  const insPo = db.prepare(
    'INSERT INTO purchase_orders (po, supplier, sku, qty, expected_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  );

  products.forEach((r) => insProduct.run(...r));
  inventory.forEach((r) => insInv.run(...r));
  suppliers.forEach((r) => insSup.run(...r));
  purchaseOrders.forEach((r) => insPo.run(...r));

  // Add 28 days of sales history, including days with zero sales.
  salesPatterns.forEach(([sku, location, fn]) => {
    for (let i = 28; i >= 1; i--) {
      insSale.run(dateOffset(-i), sku, location, fn(i));
    }
  });
}

// Clears and reloads all demo data.
function reseed() {
  const run = db.transaction(() => {
    ['actions', 'purchase_orders', 'suppliers', 'sales', 'inventory', 'products']
      .forEach((t) => db.prepare(`DELETE FROM ${t}`).run());

    db.prepare('DELETE FROM sqlite_sequence').run();

    insertAll();
  });

  run();
}

// Seeds the database only if it has no products.
function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();

  if (n === 0) {
    db.transaction(insertAll)();
    console.log('Database was empty — seeded demo data.');
  }
}

module.exports = { reseed, seedIfEmpty };

if (require.main === module) {
  reseed();
  console.log('Database reseeded with Kaveri demo data.');
}