import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function importExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/orders/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getOrders(params) {
  const response = await api.get('/api/orders', { params });
  return response.data;
}

export async function getStats() {
  const response = await api.get('/api/orders/stats');
  return response.data.stats;
}

export async function getStockageRows() {
  const response = await api.get('/api/stockage');
  return response.data.rows;
}

export async function createStockageRow(row) {
  const response = await api.post('/api/stockage', row);
  return response.data.row;
}

export async function updateStockageRow(id, row) {
  const response = await api.put(`/api/stockage/${id}`, row);
  return response.data.row;
}

export async function deleteStockageRow(id) {
  const response = await api.delete(`/api/stockage/${id}`);
  return response.data;
}

export async function clearStockage() {
  const response = await api.delete('/api/stockage');
  return response.data;
}

export async function updateOrderStatus(id, etat_commande) {
  const response = await api.patch(`/api/orders/${id}/status`, { etat_commande });
  return response.data.order;
}

export async function updateOrder(id, updates) {
  console.log('PATCH /api/orders/' + id, updates);
  const response = await api.patch(`/api/orders/${id}`, updates);
  console.log('PATCH response', response.data);
  return response.data.order;
}

export async function deleteOrder(id) {
  const response = await api.delete(`/api/orders/${id}`);
  return response.data;
}

export async function bulkDeleteOrders(ids) {
  const response = await api.post('/api/orders/bulk-delete', { ids });
  return response.data;
}

export async function exportOrders(params) {
  const response = await api.get('/api/orders/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportSelectedOrders(ids) {
  const response = await api.post('/api/orders/export-selected', { ids }, { responseType: 'blob' });
  return response.data;
}
