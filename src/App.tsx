
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import ExpenseTrackerWireframes from './components/wireframes/ExpenseTrackerWireframes';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ProcessSmsMessages from './pages/ProcessSmsMessages';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import SmsProviderSelection from './pages/SmsProviderSelection';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import { UserProvider, useUser } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import ErrorBoundary from './components/ui/error-boundary';
import { Toaster } from './components/ui/toaster';
import { Header } from './components/header';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { auth } = useUser();
  
  if (auth.isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/signup" />;
  }
  
  return <>{children}</>;
};

// Public route component that redirects to dashboard if user is authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { auth, user } = useUser();
  
  if (auth.isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

// Inside the UserProvider, we need to ensure TransactionProvider wraps all routes that use transactions
function AppRoutes() {
  const { auth, user } = useUser();

  React.useEffect(() => {
    // Redirect to dashboard if user is authenticated and on home page
    if (auth.isAuthenticated && window.location.pathname === '/') {
      window.location.href = '/dashboard';
    }
  }, [auth.isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/wireframes" element={<ExpenseTrackerWireframes />} />
      
      <Route path="/signin" element={
        <PublicRoute>
          <SignIn />
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      } />
      
      <Route path="/onboarding" element={
        <PublicRoute>
          <Onboarding />
        </PublicRoute>
      } />
      
      {/* Wrap all protected routes that need transaction data with TransactionProvider */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <TransactionProvider>
            <Dashboard />
          </TransactionProvider>
        </ProtectedRoute>
      } />
      
      <Route path="/transactions" element={
        <ProtectedRoute>
          <TransactionProvider>
            <Transactions />
          </TransactionProvider>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <TransactionProvider>
            <Analytics />
          </TransactionProvider>
        </ProtectedRoute>
      } />
      
      <Route path="/process-sms" element={
        <ProtectedRoute>
          <TransactionProvider>
            <ProcessSmsMessages />
          </TransactionProvider>
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
      
      <Route path="/sms-providers" element={
        <ProtectedRoute>
          <SmsProviderSelection />
        </ProtectedRoute>
      } />
      
      {/* Catch all route for 404 pages */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        {/* Remove the TransactionProvider from here since we're adding it per-route */}
        <MotionConfig reducedMotion="user">
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-1">
                <AppRoutes />
              </div>
            </div>
            <Toaster />
          </Router>
        </MotionConfig>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
