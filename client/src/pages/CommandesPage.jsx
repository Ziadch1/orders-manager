import { useEffect, useState } from 'react';
import {
  importExcel,
  getOrders,
  getStats,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  exportOrders,
  bulkDeleteOrders,
  exportSelectedOrders,
} from '../services/api.js';
import ImportExportSection from '../components/ImportExportSection.jsx';
import OrdersTable from '../components/OrdersTable.jsx';
import StatsCards from '../components/StatsCards.jsx';

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
  { value: 'Retour', label: 'Retour' },
];

function CommandesPage() {
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
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  const pageCount = Math.max(1, Math.ceil(total / filter.limit));

  const tableColumns = [
    'order_id',
    'full_name',
    'phone',
    'city',
    'product_name',
    'variant_price',
    'date_commande',
    'commentaire',
  ];

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

  const handleModifyRow = (id) => {
    const row = orders.find((order) => order.id === id);
    if (!row) return;
    const rowData = row.data || {};
    setEditingRowId(id);
    setEditFormData({
      order_id: row.order_id || rowData.order_id || rowData['Order ID'] || rowData['order id'] || rowData['id commande'] || '',
      full_name: row.full_name || rowData.full_name || rowData['Full name'] || rowData['full name'] || rowData.name || rowData.nom || rowData.customer_name || '',
      phone: row.phone || rowData.phone || rowData.Phone || rowData.telephone || rowData['Téléphone'] || '',
      city: row.city || rowData.city || rowData.City || rowData.ville || '',
      product_name: row.product_name || rowData.product_name || rowData['Product name'] || rowData.product || rowData.produit || '',
      variant_price: row.variant_price || rowData.variant_price || rowData['Variant price'] || rowData.price || rowData.prix || '',
      date_commande: row.date_commande || rowData.date_commande || rowData['Date de commande'] || rowData['date commande'] || rowData.date || rowData.Date || '',
      commentaire: row.commentaire || rowData.commentaire || rowData.Commentaire || rowData.comment || rowData.Comment || '',
      etat_commande: row.etat_commande || 'En attente',
    });
  };

  const handleOrderFieldChange = (id, field, value) => {
    if (editingRowId !== id) {
      return;
    }
    setEditFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSaveRow = async (id) => {
    if (!id) {
      setError('Cannot save order: missing row ID.');
      return;
    }
    if (editingRowId !== id) {
      return;
    }
    try {
      const updated = await updateOrder(id, {
        order_id: editFormData.order_id,
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        city: editFormData.city,
        product_name: editFormData.product_name,
        variant_price: editFormData.variant_price,
        date_commande: editFormData.date_commande,
        commentaire: editFormData.commentaire,
        etat_commande: editFormData.etat_commande,
      });
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, ...updated } : order
        )
      );
      setEditingRowId(null);
      setEditFormData({});
      setMessage('Order saved successfully.');
      setTimeout(() => setMessage(''), 4000);
      await loadStats();
    } catch (err) {
      console.error(err);
      setError('Unable to save order.');
    }
  };

  const visibleOrderIds = orders.map((order) => order.id);
  const allVisibleSelected = orders.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.includes(id));
  const someVisibleSelected = orders.some((order) => selectedOrderIds.includes(order.id));

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleSelectAllVisibleRows = () => {
    if (allVisibleSelected) {
      setSelectedOrderIds((current) => current.filter((id) => !visibleOrderIds.includes(id)));
      return;
    }
    setSelectedOrderIds((current) => Array.from(new Set([...current, ...visibleOrderIds])));
  };

  const handleDeleteSelected = async () => {
    if (selectedOrderIds.length === 0) {
      setError('Please select at least one row to delete.');
      return;
    }
    if (!window.confirm(`Delete ${selectedOrderIds.length} selected order(s)?`)) {
      return;
    }
    try {
      const result = await bulkDeleteOrders(selectedOrderIds);
      if (!result || result.deletedCount === 0) {
        setError('No selected rows were deleted.');
        return;
      }
      setOrders((current) => current.filter((order) => !selectedOrderIds.includes(order.id)));
      setSelectedOrderIds([]);
      setMessage(`${result.deletedCount} orders deleted successfully.`);
      setTimeout(() => setMessage(''), 4000);
      await loadStats();
    } catch (err) {
      console.error(err);
      setError('Unable to delete selected orders.');
    }
  };

  const handleExportSelected = async () => {
    if (selectedOrderIds.length === 0) {
      setError('Please select rows to export.');
      return;
    }
    setLoadingExport(true);
    setError('');
    try {
      const blob = await exportSelectedOrders(selectedOrderIds);
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'selected-orders-export.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Export selected failed.');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) {
      return;
    }
    try {
      await deleteOrder(id);
      setOrders((current) => current.filter((order) => order.id !== id));
      setSelectedOrderIds((current) => current.filter((selectedId) => selectedId !== id));
      setMessage('Order deleted successfully.');
      await loadStats();
    } catch (err) {
      console.error(err);
      setError('Could not delete the order.');
    }
  };

  return (
    <div>
      {message && <div className="message-banner">{message}</div>}
      {error && (
        <div className="message-banner" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}

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
              placeholder="Search customer, product, city, date, order ID"
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

      <div className="card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>{selectedOrderIds.length > 0 ? `${selectedOrderIds.length} selected` : 'No rows selected'}</div>
        <div className="controls">
          <button className="button-danger" type="button" onClick={handleDeleteSelected} disabled={selectedOrderIds.length === 0}>
            Delete Selected
          </button>
          <button className="button" type="button" onClick={handleExportSelected} disabled={selectedOrderIds.length === 0 || loadingExport}>
            {loadingExport ? 'Exporting...' : 'Export Selected'}
          </button>
        </div>
      </div>

      <OrdersTable
        columns={tableColumns}
        orders={orders}
        loading={loading}
        editingRowId={editingRowId}
        editFormData={editFormData}
        selectedOrderIds={selectedOrderIds}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        onToggleSelectOrder={toggleSelectOrder}
        onToggleSelectAll={toggleSelectAllVisibleRows}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onModifyRow={handleModifyRow}
        onSaveRow={handleSaveRow}
        onOrderFieldChange={handleOrderFieldChange}
        page={filter.page}
        pageCount={pageCount}
        onPageChange={(nextPage) => setFilter((prev) => ({ ...prev, page: nextPage }))}
      />
    </div>
  );
}

export default CommandesPage;
