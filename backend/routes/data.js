const express = require('express');
const db = require('../db');

const router = express.Router();

function listEndpoint(path, table, filterColumns, orderBy) {
router.get(path, (req, res, next) => {
try {
const where = [];
const params = [];


  for (const col of filterColumns) {
    if (req.query[col] !== undefined) {
      where.push(`${col} = ?`);
      params.push(String(req.query[col]));
    }
  }

  const sql =
    `SELECT * FROM ${table}` +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ` ORDER BY ${orderBy}`;

  res.json(db.prepare(sql).all(...params));
} catch (err) {
  next(err);
}


});
}

listEndpoint('/products', 'products', ['sku', 'category'], 'sku');
listEndpoint('/inventory', 'inventory', ['sku', 'location'], 'sku, location');
listEndpoint('/suppliers', 'suppliers', ['sku', 'supplier'], 'sku, lead_time_days');
listEndpoint(
'/purchase-orders',
'purchase_orders',
['sku', 'supplier', 'status'],
'expected_date'
);

router.get('/sales', (req, res, next) => {
try {
const where = [];
const params = [];

if (req.query.days !== undefined) {
  const days = Number(req.query.days);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return res.status(400).json({
      error: 'days must be a whole number between 1 and 365'
    });
  }

  where.push("date >= date('now', ?)");
  params.push(`-${days} days`);
}

for (const col of ['sku', 'location']) {
  if (req.query[col] !== undefined) {
    where.push(`${col} = ?`);
    params.push(String(req.query[col]));
  }
}

const sql =
  'SELECT * FROM sales' +
  (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
  ' ORDER BY date, sku, location';

res.json(db.prepare(sql).all(...params));

} catch (err) {
next(err);
}
});

module.exports = router;
