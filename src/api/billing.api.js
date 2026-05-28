import api from './axios';

export const generateBill = (order_id) => api.post(`/billing/generate/${order_id}`);
export const getBill = (bill_id) => api.get(`/billing/${bill_id}`);
export const getBillByOrder = (order_id) => api.get(`/billing/order/${order_id}`);
