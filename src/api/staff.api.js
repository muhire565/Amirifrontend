import api from './axios';

export const getStaff = (params) => api.get('/staff', { params });
export const getStaffById = (id) => api.get(`/staff/${id}`);
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.patch(`/staff/${id}`, data);
export const deactivateStaff = (id) => api.delete(`/staff/${id}`);
