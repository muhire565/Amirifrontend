import api from './axios';

export const login = (data) => api.post('/auth/login', data);
export const pinLogin = (data) => api.post('/auth/pin-login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
