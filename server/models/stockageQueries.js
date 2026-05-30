const pool = require('../db');

function mapRowToFrontend(row) {
  return {
    id: row.id,
    idProduit: row.id_produit ?? '',
    produit: row.produit ?? '',
    categorie: row.categorie ?? '',
    fournisseur: row.fournisseur ?? '',
    dateAchat: row.date_achat ?? '',
    qteAchat: row.qte_achetee ?? 0,
    prixAchat: row.prix_achat_unit ?? 0,
    coutLivraison: row.cout_livraison ?? 0,
    prixVente: row.prix_vente ?? 0,
    ads: row.ads ?? 0,
    stockVendu: row.stock_vendu ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getStockageRows() {
  const rows = await pool.all(
    `SELECT id, id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at FROM stockage ORDER BY id ASC`
  );
  return rows.map(mapRowToFrontend);
}

async function createStockageRow(rowData) {
  const query = `INSERT INTO stockage (id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
  const values = [
    rowData.idProduit || '',
    rowData.produit || '',
    rowData.categorie || '',
    rowData.fournisseur || '',
    rowData.dateAchat || '',
    Number(rowData.qteAchat) || 0,
    Number(rowData.prixAchat) || 0,
    Number(rowData.coutLivraison) || 0,
    Number(rowData.prixVente) || 0,
    Number(rowData.ads) || 0,
    Number(rowData.stockVendu) || 0,
  ];
  const result = await pool.run(query, values);
  const saved = await pool.get('SELECT id, id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at FROM stockage WHERE id = ?', [result.lastID]);
  return mapRowToFrontend(saved);
}

async function updateStockageRow(id, rowData) {
  const query = `UPDATE stockage SET id_produit = ?, produit = ?, categorie = ?, fournisseur = ?, date_achat = ?, qte_achetee = ?, prix_achat_unit = ?, cout_livraison = ?, prix_vente = ?, ads = ?, stock_vendu = ?, updated_at = datetime('now') WHERE id = ?`;
  const values = [
    rowData.idProduit || '',
    rowData.produit || '',
    rowData.categorie || '',
    rowData.fournisseur || '',
    rowData.dateAchat || '',
    Number(rowData.qteAchat) || 0,
    Number(rowData.prixAchat) || 0,
    Number(rowData.coutLivraison) || 0,
    Number(rowData.prixVente) || 0,
    Number(rowData.ads) || 0,
    Number(rowData.stockVendu) || 0,
    id,
  ];

  await pool.run(query, values);
  const updated = await pool.get('SELECT id, id_produit, produit, categorie, fournisseur, date_achat, qte_achetee, prix_achat_unit, cout_livraison, prix_vente, ads, stock_vendu, created_at, updated_at FROM stockage WHERE id = ?', [id]);
  return updated ? mapRowToFrontend(updated) : null;
}

async function deleteStockageRow(id) {
  await pool.run('DELETE FROM stockage WHERE id = ?', [id]);
}

module.exports = {
  getStockageRows,
  createStockageRow,
  updateStockageRow,
  deleteStockageRow,
  // clear all rows
  clearAllStockageRows: async function () {
    await pool.run('DELETE FROM stockage');
  },
};
