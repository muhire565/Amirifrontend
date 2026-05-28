import api from './axios';

export const createDelivery = (data) => api.post('/delivery', data);
export const getDeliveries = (params) => api.get('/delivery', { params });
export const getDeliveryById = (id) => api.get(`/delivery/${id}`);
export const assignRider = (id, data) => api.patch(`/delivery/${id}/assign-rider`, data);
export const markPickedUp = (id) => api.patch(`/delivery/${id}/picked-up`);
export const markDelivered = (id) => api.patch(`/delivery/${id}/delivered`);
export const markFailed = (id, reason) => api.patch(`/delivery/${id}/failed`, { reason });
export const getRiders = (params) => api.get('/delivery/riders', { params });
