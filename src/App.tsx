
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TransactionProvider } from '@/context/TransactionContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { ThemeProvider } from '@/components/theme-provider';

// Import pages
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Analytics from '@/pages/Analytics';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';
import ImportTransactions from '@/pages/ImportTransactions';
import ProcessSmsMessages from '@/pages/ProcessSmsMessages';
import EditTransaction from '@/pages/EditTransaction';
import SmsProviderSelection from '@/pages/SmsProviderSelection';
import KeywordBankManager from '@/pages/KeywordBankManager';
import MasterMind from '@/pages/MasterMind';
import BuildTemplate from '@/pages/BuildTemplate';
import LearningTester from '@/pages/dev/LearningTester';
import NotFound from '@/pages/NotFound';

// Import services
import { initializeCapacitor } from '@/lib/capacitor-init';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Initialize Capacitor and request permissions
const initializeApp = async () => {
  try {
    await initializeCapacitor();
    
    // Check and request notification permissions if available on native platforms
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        // Only request permissions on native platforms
        console.log('Running on native platform, skipping LocalNotifications for now');
      }
    } catch (error) {
      console.warn('Notification permissions not available:', error);
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useUser();
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useUser();
  
  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="xpensia-ui-theme">
        <UserProvider>
          <TransactionProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
                  <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                  
                  {/* Protected routes */}
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/import-transactions" element={<ProtectedRoute><ImportTransactions /></ProtectedRoute>} />
                  <Route path="/process-sms" element={<ProtectedRoute><ProcessSmsMessages /></ProtectedRoute>} />
                  <Route path="/edit-transaction" element={<ProtectedRoute><EditTransaction /></ProtectedRoute>} />
                  <Route path="/sms-provider-selection" element={<ProtectedRoute><SmsProviderSelection /></ProtectedRoute>} />
                  <Route path="/keyword-bank" element={<ProtectedRoute><KeywordBankManager /></ProtectedRoute>} />
                  <Route path="/mastermind" element={<ProtectedRoute><MasterMind /></ProtectedRoute>} />
                  <Route path="/build-template" element={<ProtectedRoute><BuildTemplate /></ProtectedRoute>} />
                  <Route path="/dev/learning-tester" element={<ProtectedRoute><LearningTester /></ProtectedRoute>} />
                  
                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </TransactionProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
