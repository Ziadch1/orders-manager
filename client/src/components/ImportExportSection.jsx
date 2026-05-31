function ImportExportSection({ onImport, onExport, importing, loadingExport }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Excel import & export</h2>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            Import orders from Excel and export your filtered table.
          </p>
        </div>
        <div className="controls">
          <label className="button-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </label>
          <button className="button" onClick={onExport} disabled={loadingExport}>
            {loadingExport ? 'Exporting...' : 'Export All'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportExportSection;
