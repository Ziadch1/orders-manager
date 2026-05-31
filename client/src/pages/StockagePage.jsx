import { useEffect, useMemo, useState } from 'react';
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

  const handleRowChange = (rowIndex, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, index) =>
        index === rowIndex
          ? { ...row, [field]: value, dirty: row.id ? true : row.dirty, saving: false, saveError: null, savedAt: null }
          : row
      )
    );
  };

  const handleSaveRow = async (rowIndex) => {
    const rowToSave = rows[rowIndex];
    if (!rowToSave || !rowToSave.id) return;

    setRows((currentRows) =>
      currentRows.map((row, index) => (index === rowIndex ? { ...row, saving: true, saveError: null } : row))
    );

    try {
      const saved = await updateStockageRow(rowToSave.id, rowToSave);
      setRows((currentRows) =>
        currentRows.map((row, index) =>
          index === rowIndex
            ? { ...row, ...saved, saving: false, dirty: false, saveError: null, savedAt: Date.now() }
            : row
        )
      );
      setTimeout(() => {
        setRows((currentRows) =>
          currentRows.map((row, index) => (index === rowIndex ? { ...row, savedAt: null } : row))
        );
      }, 3000);
    } catch (err) {
      console.error('Unable to save stockage row', err);
      setRows((currentRows) =>
        currentRows.map((row, index) =>
          index === rowIndex ? { ...row, saving: false, saveError: 'Save failed' } : row
        )
      );
    }
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
        onSaveRow={handleSaveRow}
        onAddRow={handleAddRow}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default StockagePage;
