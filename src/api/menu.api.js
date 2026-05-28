import api from './axios';

export const getCategories = (branch_id) => api.get('/menu/categories', { params: { branch_id } });
export const createCategory = (data) => api.post('/menu/categories', data);
export const getItems = (params) => api.get('/menu/items', { params });
export const createItem = (data) => api.post('/menu/items', data);
export const updateItem = (id, data) => api.patch(`/menu/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/menu/items/${id}`);
export const restockBeverage = (id, quantity) => api.post(`/menu/items/${id}/restock`, { quantity });
export const getLowStockBeverages = () => api.get('/menu/beverages/low-stock');
