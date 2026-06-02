const express = require('express');
const { importOrders, getOrders, updateStatus, updateOrder, deleteOrder, exportOrders, exportSelectedOrders, bulkDeleteOrders, getStats } = require('../controllers/ordersController');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/import', upload.single('file'), importOrders);
router.get('/stats', getStats);
router.get('/', getOrders);
router.patch('/:id/status', updateStatus);
router.patch('/:id', updateOrder);
// bulk delete must be defined before the parameterized single-delete route
router.delete('/bulk', bulkDeleteOrders);
router.delete('/:id', deleteOrder);
router.get('/export', exportOrders);
router.post('/export-selected', exportSelectedOrders);

module.exports = router;
