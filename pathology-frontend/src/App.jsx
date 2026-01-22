import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ReceptionistProvider } from './contexts/ReceptionistsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Role-based context provider wrapper
const RoleBasedProvider = ({ children }) => {
  const { user, loading } = useAuth();

  // While auth is loading, don't provide any data context yet
  if (loading) {
    return children;
  }

  // Provide appropriate context based on user role
  if (user?.role === 'Admin') {
    return <AdminProvider>{children}</AdminProvider>;
  } else if (user?.role === 'Operator') {
    return <ReceptionistProvider>{children}</ReceptionistProvider>;
  }

  // No user logged in - no data context needed
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RoleBasedProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </RoleBasedProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
