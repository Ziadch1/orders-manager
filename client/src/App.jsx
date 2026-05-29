import { useEffect, useMemo, useState } from 'react';
import {
  importExcel,
  getOrders,
  getStats,
  updateOrderStatus,
  deleteOrder,
  exportOrders,
} from './services/api.js';
import ImportExportSection from './components/ImportExportSection.jsx';
import OrdersTable from './components/OrdersTable.jsx';
import StatsCards from './components/StatsCards.jsx';

const sortOptions = [
  { value: 'imported_at', label: 'Imported date' },
  { value: 'date', label: 'Order date' },
  { value: 'price', label: 'Price' },
  { value: 'city', label: 'City' },
  { value: 'statut', label: 'Status' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Confirmé', label: 'Confirmé' },
  { value: 'Livré', label: 'Livré' },
  { value: 'Annulé', label: 'Annulé' },
];

function App() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    sortField: 'imported_at',
    sortOrder: 'asc',
    page: 1,
    limit: 10,
  });
  const [total, setTotal] = useState(0);

  const pageCount = Math.max(1, Math.ceil(total / filter.limit));

  const columns = useMemo(() => {
    const keys = new Set();
    orders.forEach((order) => {
      Object.keys(order.data || {}).forEach((key) => {
        keys.add(key);
      });
    });
    return Array.from(keys);
  }, [orders]);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [filter.page, filter.status, filter.search, filter.sortField, filter.sortOrder]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrders(filter);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setImporting(true);
    setError('');
    setMessage('');
    try {
      const result = await importExcel(file);
      setMessage(`Imported ${result.imported} rows, skipped ${result.skipped} duplicates.`);
      setFilter((prev) => ({ ...prev, page: 1 }));
      await loadOrders();
      await loadStats();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Import failed. Please check the Excel file.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setLoadingExport(true);
    setError('');
    try {
      const blob = await exportOrders({
        search: filter.search,
        status: filter.status,
        sortField: filter.sortField,
        sortOrder: filter.sortOrder,
      });
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders-export.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Export failed.');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, etat_commande: status } : order))
      );
      await loadStats();
    } catch (err) {
      console.error(err);
      setError('Unable to update order status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) {
      return;
    }
    try {
      await deleteOrder(id);
      setOrders((current) => current.filter((order) => order.id !== id));
      setMessage('Order deleted successfully.');
      await loadStats();
    } catch (err) {
      console.error(err);
      setError('Could not delete the order.');
    }
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1 className="page-title">Store Orders Manager</h1>
          <p className="subtitle">Import Excel orders, manage statuses, search, filter, and export easily.</p>
        </div>
      </header>

      {message && <div className="message-banner">{message}</div>}
      {error && <div className="message-banner" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>}

      <div className="grid-2" style={{ marginBottom: '20px' }}>
        <ImportExportSection
          onImport={handleImport}
          onExport={handleExport}
          importing={importing}
          loadingExport={loadingExport}
        />
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Filters & sorting</h2>
          <div className="controls" style={{ flexWrap: 'wrap' }}>
            <input
              type="search"
              placeholder="Search customer, product, city, order ID"
              value={filter.search}
              onChange={(event) => setFilter((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
            />
            <select value={filter.status} onChange={(event) => setFilter((prev) => ({ ...prev, status: event.target.value, page: 1 }))}>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select value={filter.sortField} onChange={(event) => setFilter((prev) => ({ ...prev, sortField: event.target.value }))}>
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  Sort by {item.label}
                </option>
              ))}
            </select>
            <select value={filter.sortOrder} onChange={(event) => setFilter((prev) => ({ ...prev, sortOrder: event.target.value }))}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      <StatsCards stats={stats} />

      <OrdersTable
        columns={columns}
        orders={orders}
        loading={loading}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        page={filter.page}
        pageCount={pageCount}
        onPageChange={(nextPage) => setFilter((prev) => ({ ...prev, page: nextPage }))}
      />
    </div>
  );
}

export default App;
