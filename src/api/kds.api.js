import api from './axios';

export const getKdsOrders = (params) => api.get('/kds/orders', { params });
export const updateKdsOrderStatus = (id, status) => api.patch(`/kds/orders/${id}/status`, { status });
export const updateKdsItemStatus = (item_id, status) => api.patch(`/kds/items/${item_id}/status`, { status });

// Keep legacy names for compatibility if needed, but the above match the new KDSPage
export const getKDSOrders = getKdsOrders;
export const updateOrderStatus = updateKdsOrderStatus;
export const updateItemStatus = updateKdsItemStatus;
