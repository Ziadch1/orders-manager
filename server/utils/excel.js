const xlsx = require('xlsx');
const path = require('path');

function normalizeHeader(header) {
  return String(header || '').trim();
}

function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  const rows = rawRows.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      normalized[normalizeHeader(key)] = row[key];
    });
    return normalized;
  });
  return rows;
}

function buildExcelBuffer(records) {
  if (!Array.isArray(records)) {
    records = [];
  }
  const rows = records.map((record) => {
    return {
      id: record.id,
      etat_commande: record.etat_commande,
      imported_at: record.imported_at,
      updated_at: record.updated_at,
      ...record.data,
    };
  });
  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');
  return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

function findFieldValue(row, keys) {
  const lowerKeys = Object.keys(row).reduce((map, key) => {
    map[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
    return map;
  }, {});
  for (const key of keys) {
    const searchKey = key.toLowerCase().replace(/\s+/g, '_');
    if (Object.prototype.hasOwnProperty.call(lowerKeys, searchKey)) {
      return lowerKeys[searchKey];
    }
  }
  return undefined;
}

function buildDedupeKey(row) {
  const orderId = findFieldValue(row, ['order_id', 'order id', 'id', 'commande id', 'numéro de commande']);
  if (orderId) {
    return `order_id:${String(orderId).trim().toLowerCase()}`;
  }
  const phone = findFieldValue(row, ['phone', 'telephone', 'phone number', 'contact', 'mobile']);
  const product = findFieldValue(row, ['product', 'produit', 'item', 'article']);
  const date = findFieldValue(row, ['date', 'order_date', 'order date', 'date de commande', 'created_at']);
  if (phone || product || date) {
    return `fallback:${String(phone || '').trim().toLowerCase()}|${String(product || '').trim().toLowerCase()}|${String(date || '').trim().toLowerCase()}`;
  }
  return `fallback:${JSON.stringify(row).toLowerCase()}`;
}

module.exports = {
  parseExcelFile,
  buildExcelBuffer,
  buildDedupeKey,
};
