const express = require('express');
const {
  getStockageRows,
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
} = require('../controllers/stockageController');

const router = express.Router();

router.get('/', getStockageRows);
router.post('/', createStockageRow);
router.delete('/', clearStockage);
router.put('/:id', updateStockageRow);
router.delete('/:id', deleteStockageRow);

module.exports = router;
