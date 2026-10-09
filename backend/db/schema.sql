CREATE TABLE IF NOT EXISTS products (
  sku TEXT PRIMARY KEY,
  name TEXT,
  machine_model TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT,
  location TEXT,
  stock INTEGER
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  sku TEXT,
  location TEXT,
  qty_sold INTEGER
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier TEXT,
  sku TEXT,
  price REAL,
  lead_time_days INTEGER,
  moq INTEGER
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  po TEXT PRIMARY KEY,
  supplier TEXT,
  sku TEXT,
  qty INTEGER,
  expected_date TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  sku TEXT,
  details TEXT,
  evidence TEXT,
  explanation TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);