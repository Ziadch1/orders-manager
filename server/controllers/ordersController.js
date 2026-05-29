const fs = require('fs');
const path = require('path');
const { parseExcelFile, buildExcelBuffer, buildDedupeKey } = require('../utils/excel');
const orderQueries = require('../models/orderQueries');

async function importOrders(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required.' });
    }
    const rows = parseExcelFile(req.file.path);
    if (!rows.length) {
      return res.status(400).json({ error: 'No rows found in the Excel file.' });
    }

    const dedupeKeys = rows.map((row) => buildDedupeKey(row));
    const existing = await orderQueries.findExistingDedupeKeys(dedupeKeys);
    const existingSet = new Set(existing);
    const seen = new Set();
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const key = dedupeKeys[i];
      if (existingSet.has(key) || seen.has(key)) {
        skipped += 1;
        continue;
      }
      await orderQueries.insertOrder(row, key);
      seen.add(key);
      inserted += 1;
    }

    res.json({
      message: 'Import completed.',
      imported: inserted,
      skipped,
    });
  } catch (error) {
    next(error);
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
}

async function getOrders(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const sortField = req.query.sortField || 'imported_at';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    const [orders, total] = await Promise.all([
      orderQueries.getOrders({
        search: req.query.search,
        status: req.query.status,
        limit,
        offset,
        sortField,
        sortOrder,
      }),
      orderQueries.countOrders({
        search: req.query.search,
        status: req.query.status,
      }),
    ]);

    res.json({
      orders,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const etat_commande = req.body.etat_commande;
    if (!etat_commande) {
      return res.status(400).json({ error: 'etat_commande is required.' });
    }
    const updated = await orderQueries.updateOrderStatus(id, etat_commande);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({ order: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await orderQueries.deleteOrder(id);
    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

async function exportOrders(req, res, next) {
  try {
    const orders = await orderQueries.getOrdersForExport({
      search: req.query.search,
      status: req.query.status,
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder,
    });
    const buffer = buildExcelBuffer(orders);
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await orderQueries.getOrderStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  importOrders,
  getOrders,
  updateStatus,
  deleteOrder,
  exportOrders,
  getStats,
};
