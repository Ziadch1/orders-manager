import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getStockageRows,
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
} from '../services/api.js';
import StockageTable from '../components/StockageTable.jsx';

function StockagePage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function loadRows() {
      try {
        const savedRows = await getStockageRows();
        if (Array.isArray(savedRows)) {
          setRows(savedRows);
        }
      } catch (err) {
        console.error('Unable to load stockage rows from backend', err);
      }
    }

    loadRows();
  }, []);

  const parseNumber = (value) => {
    const cleaned = String(value).replace(/,/g, '.').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getEmptyRow = () => ({
    idProduit: '',
    produit: '',
    categorie: '',
    fournisseur: '',
    dateAchat: '',
    qteAchat: '',
    prixAchat: '',
    coutLivraison: '',
    prixVente: '',
    ads: '',
    stockVendu: '',
  });

  const computeRowTotals = (row) => {
    const qte = parseNumber(row.qteAchat);
    const prixAchat = parseNumber(row.prixAchat);
    const coutLivraison = parseNumber(row.coutLivraison);
    const prixVente = parseNumber(row.prixVente);
    const ads = parseNumber(row.ads);
    const stockVendu = parseNumber(row.stockVendu);

    const costTotal = qte * prixAchat;
    const stockRestant = qte - stockVendu;

    // New profit formula:
    // ((Stock vendu * Prix vente DH) - (Stock vendu * coût de livraison)) - (Coût stock total DH + ads)
    const revenueAfterDelivery = stockVendu * prixVente - stockVendu * coutLivraison;
    const profit = revenueAfterDelivery - (costTotal + ads);

    // New rest stock profit formula:
    // (Stock restant * Prix vente DH) - (Stock restant * coût de livraison)
    const restStockProfit = stockRestant * prixVente - stockRestant * coutLivraison;

    return {
      ...row,
      costTotal,
      stockRestant,
      profit,
      restStockProfit,
    };
  };

  const rowsWithTotals = useMemo(() => rows.map(computeRowTotals), [rows]);
  const saveTimersRef = useRef({});
  const [saveDelay, setSaveDelay] = useState(600);

  const handleRowChange = (rowIndex, field, value) => {
    // Optimistically update the UI and mark row as saving if it has an id
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value, saving: row.id ? true : row.saving, saveError: null } : row
      )
    );

    const currentRow = rows[rowIndex];
    // If there is no DB id yet, do nothing (new rows are created via Add button)
    if (!currentRow || !currentRow.id) return;

    const updatedRow = { ...currentRow, [field]: value };

    // Debounce save per row id using current saveDelay
    const timerKey = String(currentRow.id);
    if (saveTimersRef.current[timerKey]) {
      clearTimeout(saveTimersRef.current[timerKey]);
    }
    saveTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        const saved = await updateStockageRow(currentRow.id, updatedRow);
        // mark saved
        setRows((currentRows) =>
          currentRows.map((r) => (r.id === currentRow.id ? { ...r, ...saved, saving: false, saveError: null, savedAt: Date.now() } : r))
        );
        // clear savedAt after a short interval
        setTimeout(() => {
          setRows((currentRows) => currentRows.map((r) => (r.id === currentRow.id ? { ...r, savedAt: null } : r)));
        }, 3000);
      } catch (err) {
        console.error('Unable to save stockage row update', err);
        setRows((currentRows) =>
          currentRows.map((r) => (r.id === currentRow.id ? { ...r, saving: false, saveError: 'Save failed' } : r))
        );
      } finally {
        delete saveTimersRef.current[timerKey];
      }
    }, saveDelay);
  };

  const handleAddRow = async () => {
    try {
      const createdRow = await createStockageRow(getEmptyRow());
      setRows((currentRows) => [...currentRows, { ...createdRow, saving: false, saveError: null }]);
    } catch (err) {
      console.error('Unable to create new stockage row', err);
    }
  };

  const handleDeleteRow = async (rowIndex) => {
    const rowToDelete = rows[rowIndex];
    if (!rowToDelete || !rowToDelete.id) {
      setRows((currentRows) => currentRows.filter((_, index) => index !== rowIndex));
      return;
    }

    try {
      await deleteStockageRow(rowToDelete.id);
      setRows((currentRows) => currentRows.filter((_, index) => index !== rowIndex));
    } catch (err) {
      console.error('Unable to delete stockage row', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all stockage data?')) return;
    try {
      // call backend to clear
      const res = await fetch('/api/stockage', { method: 'DELETE' });
      if (!res.ok) throw new Error('Clear failed');
      setRows([]);
    } catch (err) {
      console.error('Unable to clear stockage data', err);
      alert('Failed to clear stockage data. See console for details.');
    }
  };

  return (
    <div>
      <StockageTable
        rows={rowsWithTotals}
        onRowChange={handleRowChange}
        onDeleteRow={handleDeleteRow}
        onAddRow={handleAddRow}
        saveDelay={saveDelay}
        onSaveDelayChange={setSaveDelay}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default StockagePage;
