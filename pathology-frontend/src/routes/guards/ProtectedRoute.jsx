
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        // improved loading state could go here (e.g. a spinner component)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-indigo-600 font-semibold">Loading session...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized
        return <Navigate to={user.role === 'Admin' ? '/dashboard' : '/patients'} replace />;
    }

    return children;
};

export default ProtectedRoute;
