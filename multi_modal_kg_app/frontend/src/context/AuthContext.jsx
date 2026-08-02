import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            localStorage.removeItem('token');
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 requires 'username'
        formData.append('password', password);

        const response = await api.post('/api/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', response.data.access_token);
        setCurrentUser(response.data.user);
    };

    const register = async (email, password, full_name) => {
        const response = await api.post('/api/auth/register', { email, password, full_name });
        // Automatically log in after registration
        await login(email, password);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
