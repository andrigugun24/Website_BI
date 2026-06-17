import { useState, useEffect } from 'react';
import axios from 'axios';

// Set default base URL for axios
const appUrl = window.appUrl || '';
axios.defaults.baseURL = `${appUrl}/api`;
axios.defaults.headers.common['Accept'] = 'application/json';

// Get token strictly from localStorage
const storedToken = localStorage.getItem('token');
if (storedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401 && window.location.hash !== '#/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            window.location.hash = '#/login';
        }
        return Promise.reject(error);
    }
);

export const api = {
    login: async (email, password) => {
        const response = await axios.post('/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        return response.data;
    },
    forgotPassword: async (data) => {
        const response = await axios.post('/forgot-password', data);
        return response.data;
    },
    resetPassword: async (data) => {
        const response = await axios.post('/reset-password', data);
        return response.data;
    },
    logout: async () => {
        try {
            await axios.post('/logout');
        } catch (e) {
            console.error('Logout failed on server', e);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    },
    getDashboard: () => axios.get('/dashboard').then(res => res.data),
    getProducts: (qs) => axios.get(`/products?${qs || ''}`).then(res => res.data),
    getProduct: (id) => axios.get(`/products/${id}`).then(res => res.data),
    createProduct: (data) => axios.post('/products', data).then(res => res.data),
    updateProduct: (id, data) => axios.put(`/products/${id}`, data).then(res => res.data),
    deleteProduct: (id) => axios.delete(`/products/${id}`).then(res => res.data),
    getCategories: () => axios.get('/products/categories').then(res => res.data),
    downloadProductTemplate: () => axios.get('/products/template/download', { responseType: 'blob' }).then(res => res.data),
    importProducts: (formData) => axios.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),

    getStockRequests: (qs) => axios.get(`/stock-requests?${qs || ''}`).then(res => res.data),
    createStockRequest: (data) => axios.post('/stock-requests', data).then(res => res.data),
    updateStockRequestStatus: (id, data) => axios.patch(`/stock-requests/${id}/status`, data).then(res => res.data),
    executeStockRequest: (id) => axios.patch(`/stock-requests/${id}/execute`).then(res => res.data),
    
    getTransactions: (qs) => axios.get(`/transactions?${qs || ''}`).then(res => res.data),
    createTransaction: (data) => axios.post('/transactions', data).then(res => res.data),
    downloadTransactionTemplate: () => axios.get('/transactions/template/download', { responseType: 'blob' }).then(res => res.data),
    importTransactions: (formData) => axios.post('/transactions/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
    getAnalyticsTrend: () => axios.get('/analytics/trend').then(res => res.data),
    getPeriodComparison: (qs) => axios.get(`/analytics/period-comparison?${qs || ''}`).then(res => res.data),
    getHeatmap: () => axios.get('/analytics/heatmap').then(res => res.data),
    getReportPreview: (queryString) => axios.get(`/reports/preview?${queryString || ''}`).then(res => res.data),
    getEtlLogs: () => axios.get('/data-management/etl/logs').then(res => res.data),
    runEtl: () => axios.post('/data-management/etl/run').then(res => res.data),
    updateProfile: (data) => axios.put('/me/profile', data).then(res => res.data),
    changePassword: (data) => axios.put('/me/password', data).then(res => res.data),
    logoutAll: () => axios.post('/logout-all').then(res => res.data),
    
    // Settings API & Logs
    getSettings: () => axios.get('/settings').then(res => res.data),
    updateSettings: (data) => axios.post('/settings', data).then(res => res.data),
    getActivityLogs: (qs) => axios.get(`/activity-logs?${qs || ''}`).then(res => res.data),
    
    // Notifications API
    getNotifications: () => axios.get('/notifications').then(res => res.data),
    markNotificationRead: (id) => axios.post(`/notifications/${id}/read`).then(res => res.data),
    markAllNotificationsRead: () => axios.post('/notifications/read-all').then(res => res.data),
    
    // Data Management
    importData: (data) => axios.post('/data-management/import', { data }).then(res => res.data),
    
    // User Management API
    getUsers: () => axios.get('/users').then(res => res.data),
    createUser: (data) => axios.post('/users', data).then(res => res.data),
    updateUser: (id, data) => axios.put(`/users/${id}`, data).then(res => res.data),
    deleteUser: (id) => axios.delete(`/users/${id}`).then(res => res.data),
    getRoles: () => axios.get('/roles').then(res => res.data),
};
