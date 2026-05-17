const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../paylinka.db');

let db;

function getDB() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) console.error('DB connection error:', err.message);
    });
  }
  return db;
}

function initDB() {
  return new Promise((resolve, reject) => {
    const database = getDB();
    database.serialize(() => {
      database.run(`
        CREATE TABLE IF NOT EXISTS payment_links (
          id TEXT PRIMARY KEY,
          creator_name TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          fee REAL NOT NULL DEFAULT 0,
          currency TEXT DEFAULT 'KES',
          secret_token TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      database.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          link_id TEXT NOT NULL,
          payer_name TEXT,
          payer_phone TEXT NOT NULL,
          amount REAL NOT NULL,
          fee REAL NOT NULL DEFAULT 0,
          net_amount REAL NOT NULL,
          mpesa_receipt TEXT,
          checkout_request_id TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          paid_at DATETIME,
          FOREIGN KEY (link_id) REFERENCES payment_links(id)
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('Database initialized');
          resolve();
        }
      });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDB().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { initDB, run, get, all };