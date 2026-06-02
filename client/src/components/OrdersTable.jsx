import { useEffect, useRef } from 'react';
import StatusSelect from './StatusSelect.jsx';

const statusClassMap = {
  'En attente': 'pending',
  Confirmé: 'confirmed',
  Livré: 'delivered',
  Annulé: 'cancelled',
  Retour: 'retour',
};

const columnLabels = {
  order_id: 'Order ID',
  full_name: 'Full name',
  phone: 'Phone',
  city: 'City',
  product_name: 'Product name',
  variant_price: 'Variant price',
  date_commande: 'Date de commande',
  notes: 'Notes',
};

function OrdersTable({
  columns,
  orders,
  loading,
  editingRowId,
  editFormData,
  selectedOrderIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleSelectOrder,
  onToggleSelectAll,
  onStatusChange,
  onDelete,
  onModifyRow,
  onSaveRow,
  onOrderFieldChange,
  page,
  pageCount,
  onPageChange,
}) {
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Commandes table</h2>
      <div className="table-shell">
        <table className="orders-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={allVisibleSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th>ID</th>
              {columns.map((column) => (
                <th key={column}>{columnLabels[column] || column}</th>
              ))}
              <th>État Commande</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 4} style={{ padding: '32px', textAlign: 'center' }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 4} style={{ padding: '32px', textAlign: 'center' }}>
                  No orders found. Import an Excel file to get started.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                <input
                  type="checkbox"
                  checked={selectedOrderIds?.includes(order.id)}
                  onChange={() => onToggleSelectOrder(order.id)}
                />
              </td>
              <td>{order.id}</td>
                  {columns.map((column) => {
                    const isEditing = editingRowId === order.id;
                    const value = isEditing ? editFormData[column] ?? '' : order[column] ?? order.data?.[column] ?? '';
                    if (isEditing && column !== 'etat_commande') {
                      if (column === 'notes' || column === 'date_commande' || column === 'order_id' || column === 'full_name' || column === 'phone' || column === 'city' || column === 'product_name') {
                        return (
                          <td key={column}>
                            <input
                              type={column === 'variant_price' ? 'number' : 'text'}
                              value={value}
                              onChange={(event) => onOrderFieldChange(order.id, column, event.target.value)}
                              placeholder={column === 'commentaire' ? 'Commentaire' : column === 'notes' ? 'Notes' : undefined}
                              className="comment-input"
                            />
                          </td>
                        );
                      }
                      if (column === 'variant_price') {
                        return (
                          <td key={column}>
                            <input
                              type="number"
                              value={value}
                              onChange={(event) => onOrderFieldChange(order.id, 'variant_price', event.target.value)}
                              className="comment-input"
                              step="0.01"
                              min="0"
                            />
                          </td>
                        );
                      }
                    }
                    if (column === 'notes' || column === 'date_commande') {
                      return <td key={column}>{String(value)}</td>;
                    }
                    if (column === 'variant_price' && !isEditing) {
                      return <td key={column}>{String(value)}</td>;
                    }
                    return <td key={column}>{String(value)}</td>;
                  })}
                  <td>
                    {editingRowId === order.id ? (
                      <StatusSelect
                        value={editFormData.etat_commande}
                        onChange={(value) => onOrderFieldChange(order.id, 'etat_commande', value)}
                      />
                    ) : (
                      <span className={`badge ${statusClassMap[order.etat_commande] || 'pending'}`}>
                        {order.etat_commande}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions-column">
                      <button
                        className="button-secondary small-button"
                        type="button"
                        onClick={() => onModifyRow(order.id)}
                      >
                        Modify
                      </button>
                      <button
                        className="button-primary small-button"
                        type="button"
                        onClick={() => onSaveRow(order.id)}
                        disabled={editingRowId !== order.id}
                      >
                        Save
                      </button>
                      <button className="button-danger small-button" type="button" onClick={() => onDelete(order.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button className="button-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} / {pageCount}
        </span>
        <button className="button-secondary" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default OrdersTable;
