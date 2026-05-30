const stockageQueries = require('../models/stockageQueries');

async function getStockageRows(req, res, next) {
  try {
    const rows = await stockageQueries.getStockageRows();
    res.json({ rows });
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
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
};
