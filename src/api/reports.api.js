import api from './axios';

export const getDashboard = (params) => api.get('/reports/dashboard', { params });
export const getRevenueReport = (params) => api.get('/reports/revenue', { params });
export const getPaymentsReport = (params) => api.get('/reports/payments', { params });
export const getOrdersReport = (params) => api.get('/reports/orders', { params });
export const getStaffReport = (params) => api.get('/reports/staff', { params });
export const getInventoryReport = (params) => api.get('/reports/inventory', { params });
export const getMenuReport = (params) => api.get('/reports/menu', { params });
export const getDeliveryReport = (params) => api.get('/reports/delivery', { params });
export const getBeverageReport = (params) => api.get('/reports/beverages', { params });
export const getBranchComparison = (params) => api.get('/reports/branches', { params });
export const getCashReconciliation = (params) => api.get('/reports/cash-reconciliation', { params });
export const getVoidRequests = (params) => api.get('/reports/void-requests', { params });

// Aliases for modern dashboard
export const getOwnerDashboardMetrics = getDashboard;
