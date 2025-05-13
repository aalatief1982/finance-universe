import React, { useEffect } from 'react';
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
import TrainModel from '@/pages/TrainModel';
import BuildTemplate from './pages/BuildTemplate';
import KeywordBankManager from '@/pages/KeywordBankManager';
import ProcessSmsMessages from './pages/ProcessSmsMessages';
import Signup from './pages/SignUp';
import Signin from './pages/SignIn';
import ProcessVendors from '@/pages/sms/ProcessVendors';
import VendorCategorization from '@/pages/sms/VendorCategorization';
import VendorMapping from '@/pages/VendorMapping';
import ReviewDraftTransactions from '@/pages/ReviewDraftTransactions';

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true });
      StatusBar.setBackgroundColor({ color: '#00000000' });
      StatusBar.setStyle({ style: Style.Light }); // optional: adjust based on theme
    }
  }, []);

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
              <Route path="/train-model" element={<TrainModel />} />
              <Route path="/build-template" element={<BuildTemplate />} />
              <Route path="/dev/learning-tester" element={<LearningTester />} />
              <Route path="/keyword-bank" element={<KeywordBankManager />} />
              <Route path="/process-sms" element={<ProcessSmsMessages />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/sms/process-vendors" element={<ProcessVendors />} />
              <Route path="/sms/vendors" element={<VendorCategorization />} />
              <Route path="/vendor-mapping" element={<VendorMapping />} />
              <Route path="/review-draft-transactions" element={<ReviewDraftTransactions />} />
            </Routes>
            <Toaster />
          </TransactionProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
