import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, logoutUser } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const savedUser = localStorage.getItem('digitos-user');
        const token = localStorage.getItem('accessToken');
        if (savedUser && token) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // NORMALIZATION ON LOAD
                if (parsedUser.role === 'ADMIN') parsedUser.role = 'Admin';
                if (parsedUser.role === 'RECEPTIONIST') parsedUser.role = 'Operator';

                setUser(parsedUser);
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem('digitos-user');
                localStorage.removeItem('accessToken');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await loginUser(username, password);
            // response matches ApiResponse: { statusCode, data, message, success }
            if (response.success && response.data) {
                const { token, user: userData, lab } = response.data;

                // DATA NORMALIZATION: Map Backend Roles to Frontend Roles
                let mappedRole = userData.role;
                if (userData.role === 'ADMIN') mappedRole = 'Admin';
                if (userData.role === 'RECEPTIONIST') mappedRole = 'Operator';

                const fullUser = { ...userData, role: mappedRole, labId: lab?._id }; // Merge important info

                setUser(fullUser);
                localStorage.setItem('accessToken', token);
                localStorage.setItem('digitos-user', JSON.stringify(fullUser));

                return { success: true, user: fullUser };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error("Login Error:", error);
            const msg = error.response?.data?.message || error.message || 'Login failed';
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            console.warn("Logout API failed", e);
        } finally {
            setUser(null);
            localStorage.removeItem('digitos-user');
            localStorage.removeItem('accessToken');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
