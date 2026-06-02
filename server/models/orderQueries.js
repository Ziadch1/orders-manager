const pool = require('../db');

function getField(data, keys, defaultValue = '') {
  if (!data || typeof data !== 'object') {
    return defaultValue;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
  }
  return defaultValue;
}

function normalizeOrderData(data) {
  return {
    order_id: getField(data, ['order_id', 'Order ID', 'order id', 'id commande']),
    full_name: getField(data, ['full_name', 'Full name', 'full name', 'name', 'nom', 'customer_name']),
    phone: getField(data, ['phone', 'Phone', 'telephone', 'Téléphone']),
    city: getField(data, ['city', 'City', 'ville']),
    product_name: getField(data, ['product_name', 'Product name', 'product', 'produit']),
    variant_price: getField(data, ['variant_price', 'Variant price', 'price', 'prix']),
    date_commande: getField(data, ['date_commande', 'Date de commande', 'date commande', 'date', 'Date']),
    commentaire: getField(data, ['commentaire', 'Commentaire', 'comment', 'Comment']),
    notes: getField(data, ['notes', 'Notes', 'note', 'Note', 'Remarque', 'remarque', 'Commentaires internes', 'ملاحظات']),
  };
}

function buildSearchClause(search, params) {
  if (!search) {
    return { clause: '', params };
  }
  const term = `%${search.trim().toLowerCase()}%`;
  params.push(term, term, term, term, term, term, term, term, term, term);
  const clause = `AND (
    LOWER(COALESCE(json_extract(data, '$.order_id'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.full_name'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.customer_name'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.phone'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.product_name'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.product'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.city'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.date_commande'), '')) LIKE ?
    OR LOWER(COALESCE(json_extract(data, '$.commentaire'), '')) LIKE ?
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
    expr = "COALESCE(NULLIF(date_commande, ''), NULLIF(json_extract(data, '$.date_commande'), ''), NULLIF(json_extract(data, '$.date'), ''), imported_at)";
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
  const baseData = row.data ? JSON.parse(row.data) : {};
  const normalizedData = normalizeOrderData(baseData);
  const dateCommande = row.date_commande || normalizedData.date_commande || baseData.date_commande || baseData.date || '';
  const commentaire = row.commentaire || normalizedData.commentaire || baseData.commentaire || '';
  const notes = row.notes || normalizedData.notes || baseData.notes || '';
  const data = {
    ...baseData,
    ...normalizedData,
    date_commande: dateCommande,
    commentaire,
    notes,
  };
  return {
    id: row.id,
    data,
    etat_commande: row.etat_commande,
    imported_at: row.imported_at,
    updated_at: row.updated_at,
    date_commande: dateCommande,
    commentaire,
    notes,
    order_id: normalizedData.order_id,
    full_name: normalizedData.full_name,
    phone: normalizedData.phone,
    city: normalizedData.city,
    product_name: normalizedData.product_name,
    variant_price: normalizedData.variant_price,
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
  const normalizedData = normalizeOrderData(row);
  const storedData = {
    ...row,
    ...normalizedData,
  };
  const dateCommande = normalizedData.date_commande || row.date_commande || row['Date de commande'] || row['date de commande'] || row['date'] || row['Date'] || null;
  const commentaire = normalizedData.commentaire || row.commentaire || row.Commentaire || row.comment || row.Comment || '';
  const notes = normalizedData.notes || row.notes || row.Notes || row.note || row.Note || row.Remarque || row.remarque || row['Commentaires internes'] || row['ملاحظات'] || '';
  const query = `
    INSERT INTO orders (data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at, dedupe_key)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
  `;
  const values = [JSON.stringify(storedData), 'En attente', dateCommande, commentaire, notes, dedupeKey];
  const result = await pool.run(query, values);
  const inserted = await pool.get(
    'SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at FROM orders WHERE id = ?',
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
    SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at
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
    'SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at FROM orders WHERE id = ?',
    [id]
  );
  return updated ? parseOrder(updated) : null;
}

async function updateOrder(id, updates) {
  const existing = await pool.get('SELECT data, etat_commande, date_commande, commentaire, notes FROM orders WHERE id = ?', [id]);
  if (!existing) {
    return null;
  }

  const currentData = existing.data ? JSON.parse(existing.data) : {};
  const normalizedCurrentData = {
    ...currentData,
    ...normalizeOrderData(currentData),
  };
  const updatedData = { ...normalizedCurrentData };

  if (updates.order_id !== undefined) {
    updatedData.order_id = updates.order_id;
  }
  if (updates.full_name !== undefined) {
    updatedData.full_name = updates.full_name;
  }
  if (updates.phone !== undefined) {
    updatedData.phone = updates.phone;
  }
  if (updates.city !== undefined) {
    updatedData.city = updates.city;
  }
  if (updates.product_name !== undefined) {
    updatedData.product_name = updates.product_name;
  }
  if (updates.variant_price !== undefined) {
    updatedData.variant_price = updates.variant_price;
  }

  const dateCommande = updates.date_commande !== undefined ? updates.date_commande : existing.date_commande || updatedData.date_commande || '';
  const commentaire = updates.commentaire !== undefined ? updates.commentaire : existing.commentaire || updatedData.commentaire || '';
  const notes = updates.notes !== undefined ? updates.notes : existing.notes || updatedData.notes || '';
  const etatCommande = updates.etat_commande !== undefined ? updates.etat_commande : existing.etat_commande;

  const query = `
    UPDATE orders
    SET data = ?, etat_commande = ?, date_commande = ?, commentaire = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  const values = [JSON.stringify(updatedData), etatCommande, dateCommande, commentaire, notes, id];

  await pool.run(query, values);
  const updated = await pool.get(
    'SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at FROM orders WHERE id = ?',
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
    SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at
    FROM orders
    WHERE 1=1
    ${searchClause.clause}
    ${statusClause.clause}
    ${orderClause}
  `;
  const rows = await pool.all(query, params);
  return rows.map(parseOrder);
}

async function getOrdersByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }
  const placeholders = ids.map(() => '?').join(',');
  const query = `
    SELECT id, data, etat_commande, date_commande, commentaire, notes, imported_at, updated_at
    FROM orders
    WHERE id IN (${placeholders})
    ORDER BY id ASC
  `;
  const rows = await pool.all(query, ids);
  return rows.map(parseOrder);
}

async function bulkDeleteOrders(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { changes: 0 };
  }
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM orders WHERE id IN (${placeholders})`;
  return pool.run(query, ids);
}

async function getOrderStats() {
  const query = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN etat_commande = 'Confirmé' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN etat_commande = 'Livré' THEN 1 ELSE 0 END) AS delivered,
      SUM(CASE WHEN etat_commande = 'Annulé' THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN etat_commande = 'Retour' THEN 1 ELSE 0 END) AS retour,
      SUM(CASE WHEN etat_commande = 'En attente' THEN 1 ELSE 0 END) AS pending
    FROM orders
  `;
  const row = await pool.get(query);
  return {
    total: Number(row.total || 0),
    confirmed: Number(row.confirmed || 0),
    delivered: Number(row.delivered || 0),
    cancelled: Number(row.cancelled || 0),
    retour: Number(row.retour || 0),
    pending: Number(row.pending || 0),
  };
}

module.exports = {
  findExistingDedupeKeys,
  insertOrder,
  getOrders,
  countOrders,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrdersForExport,
  getOrdersByIds,
  bulkDeleteOrders,
  getOrderStats,
};
