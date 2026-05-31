const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const useTurso = Boolean(process.env.TURSO_DATABASE_URL);
let pool;
let dbType = 'sqlite';
let dbReady = Promise.resolve();

function normalizeResult(result) {
  const changes = typeof result.rowCount === 'number'
    ? result.rowCount
    : Array.isArray(result.rows)
      ? result.rows.length
      : 0;

  return {
    lastID: result.lastInsertRowid ?? null,
    changes,
  };
}

async function initializeTurso() {
  const { createClient } = require('@libsql/client');
  pool = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  dbType = 'turso';

  const initStatements = [
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      etat_commande TEXT NOT NULL DEFAULT 'En attente',
      date_commande TEXT,
      commentaire TEXT DEFAULT '',
      imported_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      dedupe_key TEXT UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS stockage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_produit TEXT,
      produit TEXT,
      categorie TEXT,
      fournisseur TEXT,
      date_achat TEXT,
      qte_achetee REAL DEFAULT 0,
      prix_achat_unit REAL DEFAULT 0,
      cout_livraison REAL DEFAULT 0,
      prix_vente REAL DEFAULT 0,
      ads REAL DEFAULT 0,
      stock_vendu REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE INDEX IF NOT EXISTS idx_orders_imported_at ON orders(imported_at);`,
    `CREATE INDEX IF NOT EXISTS idx_orders_etat_commande ON orders(etat_commande);`,
  ];

  for (const sql of initStatements) {
    await pool.execute({ sql, args: [] });
  }
  console.log('Turso database initialized.');
}

if (useTurso) {
  dbReady = initializeTurso().catch((err) => {
    console.error('Failed to initialize Turso database:', err);
    process.exit(1);
  });
} else if (process.env.NODE_ENV === 'production') {
  console.error('Turso environment variables are required in production. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  process.exit(1);
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'orders.sqlite');
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  pool = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
      process.exit(1);
    }
  });

  const initSql = `
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  etat_commande TEXT NOT NULL DEFAULT 'En attente',
  date_commande TEXT,
  commentaire TEXT DEFAULT '',
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  dedupe_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS stockage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_produit TEXT,
  produit TEXT,
  categorie TEXT,
  fournisseur TEXT,
  date_achat TEXT,
  qte_achetee REAL DEFAULT 0,
  prix_achat_unit REAL DEFAULT 0,
  cout_livraison REAL DEFAULT 0,
  prix_vente REAL DEFAULT 0,
  ads REAL DEFAULT 0,
  stock_vendu REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_imported_at ON orders(imported_at);
CREATE INDEX IF NOT EXISTS idx_orders_etat_commande ON orders(etat_commande);
`;

  dbReady = new Promise((resolve, reject) => {
    pool.exec(initSql, (err) => {
      if (err) {
        console.error('Failed to initialize SQLite schema:', err.message);
        return reject(err);
      }
      resolve();
    });
  });
}

async function run(sql, params = []) {
  await dbReady;
  if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      pool.run(sql, params, function (err) {
        if (err) {
          return reject(err);
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  const result = await pool.execute({ sql, args: params });
  return normalizeResult(result);
}

async function all(sql, params = []) {
  await dbReady;
  if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      pool.all(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  const result = await pool.execute({ sql, args: params });
  return result.rows || [];
}

async function get(sql, params = []) {
  await dbReady;
  if (dbType === 'sqlite') {
    return new Promise((resolve, reject) => {
      pool.get(sql, params, (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  const rows = await all(sql, params);
  return Array.isArray(rows) ? rows[0] : undefined;
}

module.exports = {
  db: pool,
  run,
  all,
  get,
};
