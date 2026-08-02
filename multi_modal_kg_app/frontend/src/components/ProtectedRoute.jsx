import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

const ProtectedRoute = () => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Layout />;
};

export default ProtectedRoute;
