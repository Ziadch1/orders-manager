const express = require('express');
const { importOrders, getOrders, updateStatus, updateOrder, deleteOrder, exportOrders, exportSelectedOrders, bulkDeleteOrders, getStats } = require('../controllers/ordersController');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/import', upload.single('file'), importOrders);
router.get('/stats', getStats);
router.get('/', getOrders);
router.patch('/:id/status', updateStatus);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.post('/bulk-delete', bulkDeleteOrders);
router.delete('/bulk-delete', bulkDeleteOrders);
router.get('/export', exportOrders);
router.post('/export-selected', exportSelectedOrders);

module.exports = router;
