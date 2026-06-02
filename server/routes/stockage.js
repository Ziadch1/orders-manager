const express = require('express');
const {
  getStockageRows,
  getStockageSoldCounts,
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
  clearStockage,
} = require('../controllers/stockageController');

const router = express.Router();

router.get('/', getStockageRows);
router.get('/sold-counts', getStockageSoldCounts);
router.post('/', createStockageRow);
router.delete('/', clearStockage);
router.put('/:id', updateStockageRow);
router.patch('/:id', updateStockageRow);
router.delete('/:id', deleteStockageRow);

module.exports = router;
