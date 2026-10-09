const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'kaveri.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(
  fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
);

module.exports = db;