
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    // We can wrap react-toastify's toast function or manage our own state if needed.
    // For simplicity and consistency with the existing code's desire for custom toasts,
    // we'll stick to react-toastify but provide a wrapper.

    const showToast = useCallback((message, type = 'success') => {
        if (type === 'error') {
            toast.error(message);
        } else if (type === 'success') {
            toast.success(message);
        } else {
            toast.info(message);
        }
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
