import { useEffect, useMemo, useState } from 'react';
import StockageTable from '../components/StockageTable.jsx';

const STORAGE_KEY = 'stockageData';

function StockagePage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const storedRows = JSON.parse(raw);
        if (Array.isArray(storedRows)) {
          setRows(storedRows);
        }
      }
    } catch (err) {
      console.error('Unable to load stockage data from localStorage', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (err) {
      console.error('Unable to save stockage data to localStorage', err);
    }
  }, [rows]);

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
    costTotal: 0,
    stockRestant: 0,
    profit: 0,
    restStockProfit: 0,
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
    const profit = stockVendu * (prixVente - prixAchat - coutLivraison) - ads;
    const restStockProfit = stockRestant * (prixVente - prixAchat - coutLivraison);

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
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAddRow = () => {
    setRows((currentRows) => [...currentRows, getEmptyRow()]);
  };

  const handleDeleteRow = (rowIndex) => {
    setRows((currentRows) => currentRows.filter((_, index) => index !== rowIndex));
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
