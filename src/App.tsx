
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import { Toaster } from "@/components/ui/toaster";
import ImportTransactions from './pages/ImportTransactions';
import EditTransaction from './pages/EditTransaction';

// Import dev-only components
const LearningTester = process.env.NODE_ENV === 'development' 
  ? React.lazy(() => import('./pages/dev/LearningTester'))
  : null;

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <UserProvider>
          <TransactionProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/import-transactions" element={<ImportTransactions />} />
              <Route path="/edit-transaction" element={<EditTransaction />} />
              <Route path="/edit-transaction/:id" element={<EditTransaction />} />
              
              {/* Dev-only routes */}
              {process.env.NODE_ENV === 'development' && (
                <Route 
                  path="/dev/learning-tester" 
                  element={
                    <React.Suspense fallback={<div>Loading...</div>}>
                      {LearningTester && <LearningTester />}
                    </React.Suspense>
                  } 
                />
              )}
            </Routes>
            <Toaster />
          </TransactionProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
