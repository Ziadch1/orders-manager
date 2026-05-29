import StatusSelect from './StatusSelect.jsx';

const statusClassMap = {
  'En attente': 'pending',
  Confirmé: 'confirmed',
  Livré: 'delivered',
  Annulé: 'cancelled',
};

function OrdersTable({
  columns,
  orders,
  loading,
  onStatusChange,
  onDelete,
  page,
  pageCount,
  onPageChange,
}) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Orders table</h2>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
              <th>État Commande</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 3} style={{ padding: '32px', textAlign: 'center' }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} style={{ padding: '32px', textAlign: 'center' }}>
                  No orders found. Import an Excel file to get started.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  {columns.map((column) => {
                    const value = order.data?.[column] ?? '';
                    return <td key={column}>{String(value)}</td>;
                  })}
                  <td>
                    <div className={`badge ${statusClassMap[order.etat_commande] || 'pending'}`}>
                      <StatusSelect
                        value={order.etat_commande}
                        onChange={(value) => onStatusChange(order.id, value)}
                      />
                    </div>
                  </td>
                  <td>
                    <button className="button-danger" onClick={() => onDelete(order.id)}>
                      Delete
                    </button>
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
