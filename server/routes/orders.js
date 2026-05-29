const express = require('express');
const { importOrders, getOrders, updateStatus, deleteOrder, exportOrders, getStats } = require('../controllers/ordersController');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/import', upload.single('file'), importOrders);
router.get('/stats', getStats);
router.get('/', getOrders);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteOrder);
router.get('/export', exportOrders);

module.exports = router;
