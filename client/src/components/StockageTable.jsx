function StockageTable({ rows, onRowChange, onDeleteRow, onAddRow, saveDelay, onSaveDelayChange, onClearAll }) {
  const columns = [
    { key: 'idProduit', label: 'ID Produit', editable: true, type: 'text', widthClass: 'medium-col' },
    { key: 'produit', label: 'Produit', editable: true, type: 'text', widthClass: 'large-col' },
    { key: 'categorie', label: 'Catégorie', editable: true, type: 'text', widthClass: 'medium-col' },
    { key: 'fournisseur', label: 'Fournisseur', editable: true, type: 'text', widthClass: 'medium-col' },
    { key: 'dateAchat', label: 'Date Achat', editable: true, type: 'date', widthClass: 'date-col' },
    { key: 'qteAchat', label: 'Qté achetée', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'prixAchat', label: 'Prix achat unit. DH', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'coutLivraison', label: 'coût de livraison', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'costTotal', label: 'Coût stock total DH', editable: false, auto: true, widthClass: 'medium-col' },
    { key: 'prixVente', label: 'Prix vente DH', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'ads', label: 'ads', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'stockVendu', label: 'Stock vendu', editable: true, type: 'number', widthClass: 'small-col' },
    { key: 'stockRestant', label: 'Stock restant', editable: false, auto: true, widthClass: 'medium-col' },
    { key: 'profit', label: 'profit', editable: false, auto: true, widthClass: 'medium-col' },
    { key: 'restStockProfit', label: 'rest stock profit', editable: false, auto: true, widthClass: 'medium-col' },
  ];

  const formatCurrency = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return '-';
    }
    const sign = number < 0 ? '-' : '';
    const absolute = Math.abs(number).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${sign}${absolute} DH`;
  };

  return (
    <div className="card stockage-card">
      <div className="controls" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Stockage</h2>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            Add products and track stock, costs, profit, and remaining stock automatically.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Auto-save delay</span>
            <select value={saveDelay} onChange={(e) => onSaveDelayChange(Number(e.target.value))}>
              <option value={300}>300ms</option>
              <option value={600}>600ms</option>
              <option value={1000}>1000ms</option>
            </select>
          </label>
          <button className="button" type="button" onClick={onAddRow}>
            Add Product
          </button>
          <button className="button-secondary" type="button" onClick={onClearAll}>
            Clear Stockage Data
          </button>
        </div>
      </div>
      <div className="table-shell storage-shell">
        <table className="stockage-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ padding: '32px', textAlign: 'center' }}>
                  No products yet. Click “Add Product” to create your first row.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => {
                    const cellValue = row[column.key] ?? '';
                    const isEditable = column.editable;
                    const isAuto = column.auto;
                    const cellClass = [column.widthClass, isAuto ? 'auto-column' : ''].filter(Boolean).join(' ');
                    return (
                      <td key={column.key} className={cellClass}>
                        {isEditable ? (
                          <input
                            type={column.type}
                            value={cellValue}
                            onChange={(event) => onRowChange(rowIndex, column.key, event.target.value)}
                            placeholder={column.type === 'date' ? '' : undefined}
                            min={column.type === 'number' ? '0' : undefined}
                            style={{ width: '100%' }}
                          />
                        ) : column.key === 'costTotal' || column.key === 'profit' || column.key === 'restStockProfit' ? (
                          formatCurrency(cellValue)
                        ) : (
                          cellValue ?? '-'
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button className="button-danger" type="button" onClick={() => onDeleteRow(rowIndex)}>
                        Delete
                      </button>
                      <div className="save-status">
                        {row.saving ? (
                          <span style={{ color: '#2563eb' }}>Saving...</span>
                        ) : row.saveError ? (
                          <span style={{ color: '#dc2626' }}>Save error</span>
                        ) : row.savedAt ? (
                          <span style={{ color: '#16a34a' }}>Saved</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockageTable;
