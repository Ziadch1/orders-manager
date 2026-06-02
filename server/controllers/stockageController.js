const stockageQueries = require('../models/stockageQueries');
const orderQueries = require('../models/orderQueries');

const normalizeProductName = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const deliveredStatuses = new Set([
  'livré',
  'livre',
  'delivered',
  'confirmé livré',
  'تم التوصيل',
]);

async function getStockageRows(req, res, next) {
  try {
    const rows = await stockageQueries.getStockageRows();
    res.json({ rows });
  } catch (error) {
    next(error);
  }
}

async function getStockageSoldCounts(req, res, next) {
  try {
    const orders = await orderQueries.getOrdersForExport({});
    const counts = {};

    orders.forEach((order) => {
      const status = String(order.etat_commande || '').trim().toLowerCase();
      if (!deliveredStatuses.has(status)) {
        return;
      }

      const name = normalizeProductName(order.product_name || order.data?.product_name || order.data?.product || order.data?.produit || '');
      if (!name) {
        return;
      }

      counts[name] = (counts[name] || 0) + 1;
    });

    res.json({ counts });
  } catch (error) {
    next(error);
  }
}

async function createStockageRow(req, res, next) {
  try {
    const row = req.body;
    const created = await stockageQueries.createStockageRow(row);
    res.status(201).json({ row: created });
  } catch (error) {
    next(error);
  }
}

async function updateStockageRow(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const row = req.body;
    const updated = await stockageQueries.updateStockageRow(id, row);
    if (!updated) {
      return res.status(404).json({ error: 'Stockage row not found.' });
    }
    res.json({ row: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteStockageRow(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await stockageQueries.deleteStockageRow(id);
    res.json({ message: 'Stockage row deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

async function clearStockage(req, res, next) {
  try {
    await stockageQueries.clearAllStockageRows();
    res.json({ message: 'All stockage rows cleared.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStockageRows,
  getStockageSoldCounts,
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
  clearStockage,
};
