
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ExpenseTrackerWireframes from './components/wireframes/ExpenseTrackerWireframes';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ProcessSmsMessages from './pages/ProcessSmsMessages';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import Profile from './pages/Profile';
import { UserProvider, useUser } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import ErrorBoundary from './components/ui/error-boundary';
import { Toaster } from './components/ui/toaster';
import Header from './components/Header';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { auth } = useUser();
  
  if (auth.isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const { auth, user } = useUser();

  useEffect(() => {
    // Redirect to dashboard if user is authenticated
    if (auth.isAuthenticated && window.location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, [auth.isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<ExpenseTrackerWireframes />} />
      <Route path="/signin" element={<SignIn />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      } />
      
      <Route path="/process-sms" element={
        <ProtectedRoute>
          <ProcessSmsMessages />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <TransactionProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-1">
                <AppRoutes />
              </div>
            </div>
            <Toaster />
          </Router>
        </TransactionProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
