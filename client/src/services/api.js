import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeOrdersResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      orders: data,
      total: data.length,
      page: 1,
      limit: data.length || 10,
    };
  }

  if (Array.isArray(data?.orders)) {
    return {
      orders: data.orders,
      total: Number(data.total ?? data.orders.length),
      page: Number(data.page ?? 1),
      limit: Number(data.limit ?? 10),
    };
  }

  if (Array.isArray(data?.rows)) {
    return {
      orders: data.rows,
      total: Number(data.total ?? data.rows.length),
      page: Number(data.page ?? 1),
      limit: Number(data.limit ?? 10),
    };
  }

  return {
    orders: [],
    total: 0,
    page: 1,
    limit: 10,
  };
};

const normalizeOrder = (order) => ({
  ...order,
  orderId: order.orderId ?? order.order_id ?? '',
  fullName: order.fullName ?? order.full_name ?? '',
  phone: order.phone ?? '',
  city: order.city ?? '',
  productName: order.productName ?? order.product_name ?? '',
  variantPrice: order.variantPrice ?? order.variant_price ?? 0,
  dateCommande: order.dateCommande ?? order.date_commande ?? '',
  commentaire: order.commentaire ?? '',
  etatCommande: order.etatCommande ?? order.etat_commande ?? 'En attente',
});

const normalizeRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.stockage)) return data.stockage;
  return [];
};

const normalizeStockageRow = (row) => ({
  id: row.id,
  idProduit: row.idProduit ?? row.id_produit ?? '',
  produit: row.produit ?? '',
  categorie: row.categorie ?? '',
  fournisseur: row.fournisseur ?? '',
  dateAchat: row.dateAchat ?? row.date_achat ?? '',
  qteAchat: row.qteAchat ?? row.qte_achetee ?? 0,
  prixAchat: row.prixAchat ?? row.prix_achat_unit ?? 0,
  coutLivraison: row.coutLivraison ?? row.cout_livraison ?? 0,
  prixVente: row.prixVente ?? row.prix_vente ?? 0,
  ads: row.ads ?? 0,
  stockVendu: row.stockVendu ?? row.stock_vendu ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const toStockagePayload = (row) => ({
  idProduit: row.idProduit ?? '',
  produit: row.produit ?? '',
  categorie: row.categorie ?? '',
  fournisseur: row.fournisseur ?? '',
  dateAchat: row.dateAchat ?? '',
  qteAchat: Number(row.qteAchat || 0),
  prixAchat: Number(row.prixAchat || 0),
  coutLivraison: Number(row.coutLivraison || 0),
  prixVente: Number(row.prixVente || 0),
  ads: Number(row.ads || 0),
  stockVendu: Number(row.stockVendu || 0),
});

export async function importExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/orders/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getOrders(params) {
  const response = await api.get('/orders', { params });
  const data = response.data;
  const normalized = normalizeOrdersResponse(data);
  return {
    orders: normalized.orders.map(normalizeOrder),
    total: normalized.total,
    page: normalized.page,
    limit: normalized.limit,
    raw: data,
  };
}

export async function getStats() {
  const response = await api.get('/orders/stats');
  return response.data.stats;
}

export async function getStockageRows() {
  const response = await api.get('/stockage');
  const rows = normalizeRows(response.data);
  console.log('Loaded stockage rows:', rows);
  return rows.map(normalizeStockageRow);
}

export async function createStockageRow(row) {
  const payload = toStockagePayload(row);
  console.log('Creating stockage row with payload:', payload);
  const response = await api.post('/stockage', payload);
  console.log('Created stockage response:', response.data);
  const createdRow = response.data.row || response.data;
  return normalizeStockageRow(createdRow);
}

export async function updateStockageRow(id, row) {
  const payload = toStockagePayload(row);
  console.log('Updating stockage row', id, 'with payload:', payload);
  const response = await api.put(`/stockage/${id}`, payload);
  console.log('Updated stockage response:', response.data);
  const updatedRow = response.data.row || response.data;
  return normalizeStockageRow(updatedRow);
}

export async function deleteStockageRow(id) {
  const response = await api.delete(`/stockage/${id}`);
  console.log('Deleted stockage row', id);
  return response.data;
}

export async function clearStockage() {
  const response = await api.delete('/stockage');
  return response.data;
}

export async function updateOrderStatus(id, etat_commande) {
  const response = await api.patch(`/orders/${id}/status`, { etat_commande });
  return response.data.order;
}

export async function updateOrder(id, updates) {
  console.log('PATCH /orders/' + id, updates);
  const response = await api.patch(`/orders/${id}`, updates);
  console.log('PATCH response', response.data);
  return response.data.order;
}

export async function deleteOrder(id) {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
}

export async function bulkDeleteOrders(ids) {
  console.log('API: bulkDeleteOrders called with ids:', ids);
  const response = await api.post('/orders/delete-selected', { ids });
  return response.data;
}

export async function exportOrders(params) {
  const response = await api.get('/orders/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportSelectedOrders(ids) {
  const response = await api.post('/orders/export-selected', { ids }, { responseType: 'blob' });
  return response.data;
}
