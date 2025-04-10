import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppStateProvider } from './context/AppContext';
import { CategoryProvider } from './context/CategoryContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AccountProvider } from './context/AccountContext';
import { Toaster } from "@/components/ui/toaster"
import { ScrollToTop } from './components/ScrollToTop';
import { Category } from './pages/Category';
import { Budget } from './pages/Budget';
import { AuthRoute } from './components/AuthRoute';
import { GuestRoute } from './components/GuestRoute';
import { useUser } from './context/UserContext';
import { authService } from './services/AuthService';
import { useToast } from '@/components/ui/use-toast';
import ImportTransactions from './pages/ImportTransactions';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <UserProvider>
          <TransactionProvider>
            <SettingsProvider>
              <AppStateProvider>
                <CategoryProvider>
                  <CurrencyProvider>
                    <AccountProvider>
                      <Routes>
                        <Route path="/" element={<AuthRoute><Dashboard /></AuthRoute>} />
                        <Route path="/dashboard" element={<AuthRoute><Dashboard /></AuthRoute>} />
                        <Route path="/transactions" element={<AuthRoute><Transactions /></AuthRoute>} />
                        <Route path="/accounts" element={<AuthRoute><Accounts /></AuthRoute>} />
                        <Route path="/settings" element={<AuthRoute><Settings /></AuthRoute>} />
                        <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
                        <Route path="/category" element={<AuthRoute><Category /></AuthRoute>} />
                        <Route path="/budget" element={<AuthRoute><Budget /></AuthRoute>} />
                        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                        <Route path="/onboarding" element={<GuestRoute><Onboarding /></GuestRoute>} />
                        <Route path="/import-transactions" element={<ImportTransactions />} />
                      </Routes>
                      <Toaster />
                    </AccountProvider>
                  </CurrencyProvider>
                </CategoryProvider>
              </AppStateProvider>
            </SettingsProvider>
          </TransactionProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
