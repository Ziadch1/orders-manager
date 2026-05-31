const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'orders.sqlite');
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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

db.exec(initSql, (err) => {
  if (err) {
    console.error('Failed to initialize SQLite schema:', err.message);
    process.exit(1);
  }
});

// Migration: if an older `stockage` table stored a JSON `data` column, add explicit columns
// and migrate JSON fields into them. This keeps existing user data intact and removes the legacy `data` field.
db.all("PRAGMA table_info(stockage)", (err, cols) => {
  if (err) {
    // not fatal
    return;
  }
  const colNames = (cols || []).map((c) => c.name);
  if (colNames.includes('data')) {
    // add missing columns if not present
    const addIfMissing = (colDef) => {
      const name = colDef.split(' ')[0];
      if (!colNames.includes(name)) {
        db.run(`ALTER TABLE stockage ADD COLUMN ${colDef}`);
      }
    };

    addIfMissing('id_produit TEXT');
    addIfMissing('produit TEXT');
    addIfMissing('categorie TEXT');
    addIfMissing('fournisseur TEXT');
    addIfMissing('date_achat TEXT');
    addIfMissing('qte_achetee REAL DEFAULT 0');
    addIfMissing('prix_achat_unit REAL DEFAULT 0');
    addIfMissing('cout_livraison REAL DEFAULT 0');
    addIfMissing('prix_vente REAL DEFAULT 0');
    addIfMissing('ads REAL DEFAULT 0');
    addIfMissing('stock_vendu REAL DEFAULT 0');

    // Try to migrate JSON values into new columns and then rebuild the table without the legacy data field.
    db.serialize(() => {
      const updateSql = `UPDATE stockage SET
        id_produit = COALESCE(json_extract(data, '$.idProduit'), json_extract(data, '$.id_produit'), ''),
        produit = COALESCE(json_extract(data, '$.produit'), ''),
        categorie = COALESCE(json_extract(data, '$.categorie'), ''),
        fournisseur = COALESCE(json_extract(data, '$.fournisseur'), ''),
        date_achat = COALESCE(json_extract(data, '$.dateAchat'), json_extract(data, '$.date_achat'), ''),
        qte_achetee = COALESCE(json_extract(data, '$.qteAchat'), json_extract(data, '$.qte_achetee'), 0),
        prix_achat_unit = COALESCE(json_extract(data, '$.prixAchat'), json_extract(data, '$.prix_achat_unit'), 0),
        cout_livraison = COALESCE(json_extract(data, '$.coutLivraison'), json_extract(data, '$.cout_livraison'), 0),
        prix_vente = COALESCE(json_extract(data, '$.prixVente'), json_extract(data, '$.prix_vente'), 0),
        ads = COALESCE(json_extract(data, '$.ads'), 0),
        stock_vendu = COALESCE(json_extract(data, '$.stockVendu'), json_extract(data, '$.stock_vendu'), 0)
        WHERE data IS NOT NULL;`;

      db.run(updateSql, (updateErr) => {
        if (updateErr) {
          console.error('Stockage migration update warning:', updateErr.message || updateErr);
        }

        const createTempTableSql = `CREATE TABLE stockage_new (
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
        );`;

        db.run(createTempTableSql, (createErr) => {
          if (createErr) {
            console.error('Stockage migration create warning:', createErr.message || createErr);
            return;
          }

          const copySql = `INSERT INTO stockage_new (id, id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at)
            SELECT id, id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at
            FROM stockage;`;

          db.run(copySql, (copyErr) => {
            if (copyErr) {
              console.error('Stockage migration copy warning:', copyErr.message || copyErr);
              return;
            }

            db.run('DROP TABLE stockage', (dropErr) => {
              if (dropErr) {
                console.error('Stockage migration drop warning:', dropErr.message || dropErr);
                return;
              }

              db.run('ALTER TABLE stockage_new RENAME TO stockage', (renameErr) => {
                if (renameErr) {
                  console.error('Stockage migration rename warning:', renameErr.message || renameErr);
                  return;
                }
                console.log('Stockage migration completed: legacy data field removed.');
              });
            });
          });
        });
      });
    });
  }
});

// Migration for orders: add date_commande and commentaire if missing, and populate from JSON data when available.
db.all("PRAGMA table_info(orders)", (err, cols) => {
  if (err) {
    return;
  }
  const colNames = (cols || []).map((c) => c.name);
  const addIfMissing = (colDef) => {
    const name = colDef.split(' ')[0];
    if (!colNames.includes(name)) {
      db.run(`ALTER TABLE orders ADD COLUMN ${colDef}`);
    }
  };

  addIfMissing('date_commande TEXT');
  addIfMissing("commentaire TEXT DEFAULT ''");

  if (colNames.includes('data')) {
    const updateSql = `UPDATE orders SET
      date_commande = COALESCE(
        json_extract(data, '$.date_commande'),
        json_extract(data, '$.Date de commande'),
        json_extract(data, '$.date de commande'),
        json_extract(data, '$.date commande'),
        json_extract(data, '$.date'),
        date_commande
      ),
      commentaire = COALESCE(
        json_extract(data, '$.commentaire'),
        json_extract(data, '$.Commentaire'),
        commentaire
      )
      WHERE data IS NOT NULL;
    `;
    db.run(updateSql, (updateErr) => {
      if (updateErr) {
        console.error('Orders migration warning:', updateErr.message || updateErr);
      }
    });
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row);
    });
  });
}

module.exports = {
  db,
  run,
  all,
  get,
};
