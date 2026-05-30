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

  const handleRowChange = (rowIndex, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row))
    );

    const currentRow = rows[rowIndex];
    // If there is no DB id yet, do nothing (new rows are created via Add button)
    if (!currentRow || !currentRow.id) return;

    const updatedRow = { ...currentRow, [field]: value };

    // Debounce save per row id
    const timerKey = String(currentRow.id);
    if (saveTimersRef.current[timerKey]) {
      clearTimeout(saveTimersRef.current[timerKey]);
    }
    saveTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        await updateStockageRow(currentRow.id, updatedRow);
      } catch (err) {
        console.error('Unable to save stockage row update', err);
      } finally {
        delete saveTimersRef.current[timerKey];
      }
    }, 600);
  };

  const handleAddRow = async () => {
    try {
      const createdRow = await createStockageRow(getEmptyRow());
      setRows((currentRows) => [...currentRows, createdRow]);
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

  return (
    <div>
      <StockageTable
        rows={rowsWithTotals}
        onRowChange={handleRowChange}
        onDeleteRow={handleDeleteRow}
        onAddRow={handleAddRow}
      />
    </div>
  );
}

export default StockagePage;
