import api from './axios';

export const getTables = (params) => api.get('/tables', { params });
export const createTable = (data) => api.post('/tables', data);
export const updateTable = (id, data) => api.patch(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);
