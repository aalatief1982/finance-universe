
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { TransactionBuilderProvider } from './context/transaction-builder';

// Import pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ImportTransactions = lazy(() => import('./pages/ImportTransactions'));
const EditTransaction = lazy(() => import('./pages/EditTransaction'));
const SuggestionsAdmin = lazy(() => import('./pages/SuggestionsAdmin'));
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for Suspense
const Loading = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="xpensia-theme">
      <TransactionBuilderProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/import" element={<ImportTransactions />} />
              <Route path="/edit-transaction" element={<EditTransaction />} />
              <Route path="/suggestions-admin" element={<SuggestionsAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </TransactionBuilderProvider>
    </ThemeProvider>
  );
}

export default App;
