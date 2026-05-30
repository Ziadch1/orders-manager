function StockageTable({ rows, onRowChange, onDeleteRow, onAddRow }) {
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
        <button className="button" type="button" onClick={onAddRow}>
          Add Product
        </button>
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
                    <button className="button-danger" type="button" onClick={() => onDeleteRow(rowIndex)}>
                      Delete
                    </button>
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
