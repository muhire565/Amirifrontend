import api from './axios';

export const getStockItems = (params) => api.get('/inventory/items', { params });
export const getStockItemById = (id) => api.get(`/inventory/items/${id}`);
export const createStockItem = (data) => api.post('/inventory/items', data);
export const updateStockItem = (id, data) => api.patch(`/inventory/items/${id}`, data);
export const restockItem = (data) => api.post('/inventory/restock', data);
export const logWastage = (data) => api.post('/inventory/wastage', data);
export const getWastage = (params) => api.get('/inventory/wastage', { params });
export const setMenuIngredients = (data) => api.post('/inventory/menu-ingredients', data);
export const getMenuIngredients = (menu_item_id) => api.get(`/inventory/menu-ingredients/${menu_item_id}`);
export const getDeductions = (params) => api.get('/inventory/deductions', { params });
export const getAlerts = (params) => api.get('/inventory/alerts', { params });
export const resolveAlert = (id) => api.patch(`/inventory/alerts/${id}/resolve`);
