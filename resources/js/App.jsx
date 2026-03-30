import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrendAnalysis from './pages/TrendAnalysis';
import Products from './pages/Products';
import Reports from './pages/Reports';
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import ResetPassword from './pages/ResetPassword';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Layout>{children}</Layout>;
};

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/trend" element={<PrivateRoute><TrendAnalysis /></PrivateRoute>} />
                <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
                <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/data" element={<PrivateRoute adminOnly><DataManagement /></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    );
}
