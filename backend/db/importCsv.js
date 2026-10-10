
const fs = require('fs');
const path = require('path');
const db = require('./index');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error('CSV file not found: ' + filename);
  }

  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(filename + ' contains no data rows');
  }

  function parseLine(line) {
    const fields = [];
    let value = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        fields.push(value);
        value = '';
      } else {
        value += char;
      }
    }

    if (quoted) {
      throw new Error('Unclosed quote in ' + filename);
    }

    fields.push(value);
    return fields;
  }

  const headers = parseLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const values = parseLine(line);

    if (values.length !== headers.length) {
      throw new Error(
        filename + ', row ' + (index + 2) +
        ': expected ' + headers.length +
        ' columns, received ' + values.length
      );
    }

    return Object.fromEntries(
      headers.map((header, i) => [header, values[i].trim()])
    );
  });
}

function requiredText(value, field, row) {
  if (value === undefined || value.trim() === '') {
    throw new Error('Missing ' + field + ' at data row ' + row);
  }

  return value.trim();
}

function requiredNumber(value, field, row, integer = false) {
  if (value === undefined || value.trim() === '') {
    throw new Error('Missing ' + field + ' at data row ' + row);
  }

  const number = Number(value);

  if (!Number.isFinite(number) || (integer && !Number.isInteger(number))) {
    throw new Error('Invalid ' + field + ' at data row ' + row);
  }

  if (number < 0) {
    throw new Error(field + ' cannot be negative at data row ' + row);
  }

  return number;
}

function requireColumns(rows, columns, filename) {
  const headers = Object.keys(rows[0] || {});
  const missing = columns.filter((column) => !headers.includes(column));

  if (missing.length) {
    throw new Error(
      filename + ' is missing columns: ' + missing.join(', ')
    );
  }
}

const importData = db.transaction(() => {
  const products = readCsv('products.csv');
  const inventory = readCsv('inventory.csv');
  const sales = readCsv('sales.csv');
  const suppliers = readCsv('suppliers.csv');
  const orders = readCsv('purchase_orders.csv');

  requireColumns(
    products,
    ['sku', 'product_name', 'machine_model', 'category'],
    'products.csv'
  );

  requireColumns(
    inventory,
    ['sku', 'location', 'stock'],
    'inventory.csv'
  );

  requireColumns(
    sales,
    ['date', 'sku', 'location', 'qty_sold'],
    'sales.csv'
  );

  requireColumns(
    suppliers,
    ['supplier', 'sku', 'price', 'lead_time_days', 'moq'],
    'suppliers.csv'
  );

  requireColumns(
    orders,
    ['po', 'supplier', 'sku', 'qty', 'expected_date', 'status'],
    'purchase_orders.csv'
  );

  const productRows = products.map((r, i) => ({
    sku: requiredText(r.sku, 'sku', i + 2),
    name: requiredText(r.product_name, 'product_name', i + 2),
    machine_model: requiredText(r.machine_model, 'machine_model', i + 2),
    category: requiredText(r.category, 'category', i + 2)
  }));

  const inventoryRows = inventory.map((r, i) => ({
    sku: requiredText(r.sku, 'sku', i + 2),
    location: requiredText(r.location, 'location', i + 2),
    stock: requiredNumber(r.stock, 'stock', i + 2, true)
  }));

  const salesRows = sales.map((r, i) => ({
    date: requiredText(r.date, 'date', i + 2),
    sku: requiredText(r.sku, 'sku', i + 2),
    location: requiredText(r.location, 'location', i + 2),
    qty_sold: requiredNumber(r.qty_sold, 'qty_sold', i + 2, true)
  }));

  const supplierRows = suppliers.map((r, i) => ({
    supplier: requiredText(r.supplier, 'supplier', i + 2),
    sku: requiredText(r.sku, 'sku', i + 2),
    price: requiredNumber(r.price, 'price', i + 2),
    lead_time_days: requiredNumber(r.lead_time_days, 'lead_time_days', i + 2, true),
    moq: requiredNumber(r.moq, 'moq', i + 2, true)
  }));

  const orderRows = orders.map((r, i) => ({
    po: requiredText(r.po, 'po', i + 2),
    supplier: requiredText(r.supplier, 'supplier', i + 2),
    sku: requiredText(r.sku, 'sku', i + 2),
    qty: requiredNumber(r.qty, 'qty', i + 2, true),
    expected_date: requiredText(r.expected_date, 'expected_date', i + 2),
    status: requiredText(r.status, 'status', i + 2)
  }));

  const productSkus = new Set(productRows.map((r) => r.sku));

  if (productSkus.size !== productRows.length) {
    throw new Error('products.csv contains duplicate SKUs');
  }

  const orderNumbers = new Set(orderRows.map((r) => r.po));

  if (orderNumbers.size !== orderRows.length) {
    throw new Error('purchase_orders.csv contains duplicate PO numbers');
  }

  for (const row of [
    ...inventoryRows,
    ...salesRows,
    ...supplierRows,
    ...orderRows
  ]) {
    if (!productSkus.has(row.sku)) {
      throw new Error('SKU ' + row.sku + ' is missing from products.csv');
    }
  }

  // Replace existing data only after all CSV files pass validation.
  db.prepare('DELETE FROM actions').run();
  db.prepare('DELETE FROM purchase_orders').run();
  db.prepare('DELETE FROM sales').run();
  db.prepare('DELETE FROM inventory').run();
  db.prepare('DELETE FROM suppliers').run();
  db.prepare('DELETE FROM products').run();

  const insertProduct = db.prepare(
    'INSERT INTO products (sku, name, machine_model, category) VALUES (@sku, @name, @machine_model, @category)'
  );

  const insertInventory = db.prepare(
    'INSERT INTO inventory (sku, location, stock) VALUES (@sku, @location, @stock)'
  );

  const insertSale = db.prepare(
    'INSERT INTO sales (date, sku, location, qty_sold) VALUES (@date, @sku, @location, @qty_sold)'
  );

  const insertSupplier = db.prepare(
    'INSERT INTO suppliers (supplier, sku, price, lead_time_days, moq) VALUES (@supplier, @sku, @price, @lead_time_days, @moq)'
  );

  const insertOrder = db.prepare(
    'INSERT INTO purchase_orders (po, supplier, sku, qty, expected_date, status) VALUES (@po, @supplier, @sku, @qty, @expected_date, @status)'
  );

  for (const row of productRows) insertProduct.run(row);
  for (const row of inventoryRows) insertInventory.run(row);
  for (const row of salesRows) insertSale.run(row);
  for (const row of supplierRows) insertSupplier.run(row);
  for (const row of orderRows) insertOrder.run(row);

  return {
    products: productRows.length,
    inventory: inventoryRows.length,
    sales: salesRows.length,
    suppliers: supplierRows.length,
    purchase_orders: orderRows.length
  };
});

try {
  console.log('Importing CSV dataset...');
  console.table(importData());
  console.log('Import completed successfully.');
} catch (error) {
  console.error('Import failed. Database changes were rolled back.');
  console.error(error.message);
  process.exitCode = 1;
}

