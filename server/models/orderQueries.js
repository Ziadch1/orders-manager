const pool = require('../db');

function buildSearchClause(search, params) {
  if (!search) {
    return { clause: '', params };
  }
  const term = `%${search.trim().toLowerCase()}%`;
  params.push(term, term, term, term, term, term);
  const clause = `AND (
    LOWER(COALESCE(json_extract(data, '$.order_id'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.customer_name'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.phone'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.product'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.city'), '')) LIKE ?
    OR LOWER(data) LIKE ?
  )`;
  return { clause, params };
}

function buildStatusClause(status, params) {
  if (!status) {
    return { clause: '', params };
  }
  params.push(status);
  return { clause: `AND etat_commande = ?`, params };
}

function buildSortClause(sortField, sortOrder) {
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
  let expr = 'imported_at';
  if (sortField === 'date') {
    expr = "COALESCE(NULLIF(json_extract(data, '$.date'), ''), json_extract(data, '$.order_date'), imported_at)";
  }
  if (sortField === 'price') {
    expr = "COALESCE(CAST(json_extract(data, '$.price') AS REAL), 0)";
  }
  if (sortField === 'city') {
    expr = "LOWER(COALESCE(json_extract(data, '$.city'), ''))";
  }
  if (sortField === 'statut' || sortField === 'status' || sortField === 'etat_commande') {
    expr = "LOWER(etat_commande)";
  }
  return `ORDER BY ${expr} ${order}, id ${order}`;
}

function parseOrder(row) {
  return {
    id: row.id,
    data: row.data ? JSON.parse(row.data) : {},
    etat_commande: row.etat_commande,
    imported_at: row.imported_at,
    updated_at: row.updated_at,
  };
}

async function findExistingDedupeKeys(keys) {
  if (!keys || keys.length === 0) {
    return [];
  }
  const placeholders = keys.map(() => '?').join(', ');
  const query = `SELECT dedupe_key FROM orders WHERE dedupe_key IN (${placeholders})`;
  const rows = await pool.all(query, keys);
  return rows.map((row) => row.dedupe_key);
}

async function insertOrder(row, dedupeKey) {
  const query = `
    INSERT INTO orders (data, etat_commande, imported_at, updated_at, dedupe_key)
    VALUES (?, ?, datetime('now'), datetime('now'), ?)
  `;
  const values = [JSON.stringify(row), 'En attente', dedupeKey];
  const result = await pool.run(query, values);
  const inserted = await pool.get(
    'SELECT id, data, etat_commande, imported_at, updated_at FROM orders WHERE id = ?',
    [result.lastID]
  );
  return parseOrder(inserted);
}

async function getOrders({ search, status, limit, offset, sortField, sortOrder }) {
  const params = [];
  const searchClause = buildSearchClause(search, params);
  const statusClause = buildStatusClause(status, params);
  const orderClause = buildSortClause(sortField, sortOrder);
  const query = `
    SELECT id, data, etat_commande, imported_at, updated_at
    FROM orders
    WHERE 1=1
    ${searchClause.clause}
    ${statusClause.clause}
    ${orderClause}
    LIMIT ?
    OFFSET ?
  `;
  params.push(limit, offset);
  const rows = await pool.all(query, params);
  return rows.map(parseOrder);
}

async function countOrders({ search, status }) {
  const params = [];
  const searchClause = buildSearchClause(search, params);
  const statusClause = buildStatusClause(status, params);
  const query = `
    SELECT COUNT(*) AS count
    FROM orders
    WHERE 1=1
    ${searchClause.clause}
    ${statusClause.clause}
  `;
  const row = await pool.get(query, params);
  return Number(row.count || 0);
}

async function updateOrderStatus(id, etat_commande) {
  const query = `
    UPDATE orders
    SET etat_commande = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  await pool.run(query, [etat_commande, id]);
  const updated = await pool.get(
    'SELECT id, data, etat_commande, imported_at, updated_at FROM orders WHERE id = ?',
    [id]
  );
  return updated ? parseOrder(updated) : null;
}

async function deleteOrder(id) {
  await pool.run('DELETE FROM orders WHERE id = ?', [id]);
}

async function getOrdersForExport({ search, status, sortField, sortOrder }) {
  const params = [];
  const searchClause = buildSearchClause(search, params);
  const statusClause = buildStatusClause(status, params);
  const orderClause = buildSortClause(sortField, sortOrder);
  const query = `
    SELECT id, data, etat_commande, imported_at, updated_at
    FROM orders
    WHERE 1=1
    ${searchClause.clause}
    ${statusClause.clause}
    ${orderClause}
  `;
  const rows = await pool.all(query, params);
  return rows.map(parseOrder);
}

async function getOrderStats() {
  const query = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN etat_commande = 'Confirmé' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN etat_commande = 'Livré' THEN 1 ELSE 0 END) AS delivered,
      SUM(CASE WHEN etat_commande = 'Annulé' THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN etat_commande = 'En attente' THEN 1 ELSE 0 END) AS pending
    FROM orders
  `;
  const row = await pool.get(query);
  return {
    total: Number(row.total || 0),
    confirmed: Number(row.confirmed || 0),
    delivered: Number(row.delivered || 0),
    cancelled: Number(row.cancelled || 0),
    pending: Number(row.pending || 0),
  };
}

module.exports = {
  findExistingDedupeKeys,
  insertOrder,
  getOrders,
  countOrders,
  updateOrderStatus,
  deleteOrder,
  getOrdersForExport,
  getOrderStats,
};
