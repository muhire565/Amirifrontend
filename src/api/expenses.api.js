import api from './axios';

export const createExpense = (data) => api.post('/expenses', data);
export const getExpenses = (params) => api.get('/expenses', { params });
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
