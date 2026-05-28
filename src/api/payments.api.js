import api from './axios';

export const processPayment = (data) => api.post('/payments', data);
export const getPayments = (params) => api.get('/payments', { params });
export const getPaymentById = (id) => api.get(`/payments/${id}`);
export const getPaymentByBill = (bill_id) => api.get(`/payments/bill/${bill_id}`);
