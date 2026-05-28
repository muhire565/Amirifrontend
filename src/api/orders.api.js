import api from './axios';

export const getOrders = (params) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const addItemsToOrder = (order_id, items) => api.post(`/orders/${order_id}/items`, { items });
export const cancelOrderItem = (order_id, item_id) => api.delete(`/orders/${order_id}/items/${item_id}`);
export const markOrderServed = (order_id) => api.patch(`/orders/${order_id}/served`);
export const requestVoid = (order_id, reason) => api.post(`/orders/${order_id}/void`, { reason });
export const reviewVoid = (order_id, decision) => api.patch(`/orders/${order_id}/void/review`, { decision });
