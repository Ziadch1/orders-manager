import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeRows = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

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
  return {
    orders: normalizeRows(data),
    total: typeof data.total === 'number' ? data.total : data.total || 0,
    raw: data,
  };
}

export async function getStats() {
  const response = await api.get('/orders/stats');
  return response.data.stats;
}

export async function getStockageRows() {
  const response = await api.get('/stockage');
  return normalizeRows(response.data);
}

export async function createStockageRow(row) {
  const response = await api.post('/stockage', row);
  return response.data.row;
}

export async function updateStockageRow(id, row) {
  const response = await api.put(`/stockage/${id}`, row);
  return response.data.row;
}

export async function deleteStockageRow(id) {
  const response = await api.delete(`/stockage/${id}`);
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
  const response = await api.post('/orders/bulk-delete', { ids });
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
