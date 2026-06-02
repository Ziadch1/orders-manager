(async () => {
  try {
    const orderQueries = require('../server/models/orderQueries');
    const rows = await orderQueries.getOrders({ search: '', status: '', limit: 10, offset: 0, sortField: 'imported_at', sortOrder: 'asc' });
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
