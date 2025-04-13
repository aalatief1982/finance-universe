
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
import LearningTester from './pages/dev/LearningTester';
import MasterMind from '@/pages/MasterMind';


function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" attribute="class">
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
              <Route path="/mastermind" element={<MasterMind />} />
              
              {/* Learning Tester route - now always available */}
              <Route path="/dev/learning-tester" element={<LearningTester />} />
            </Routes>
            <Toaster />
          </TransactionProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
