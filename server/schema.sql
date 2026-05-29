CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  etat_commande TEXT NOT NULL DEFAULT 'En attente',
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  dedupe_key TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_orders_imported_at ON orders(imported_at);
CREATE INDEX IF NOT EXISTS idx_orders_etat_commande ON orders(etat_commande);
