
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ExpenseTrackerWireframes from './components/wireframes/ExpenseTrackerWireframes';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ProcessSmsMessages from './pages/ProcessSmsMessages';
import Settings from './pages/Settings';
import SignIn from './pages/SignIn';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import ErrorBoundary from './components/ui/error-boundary';
import { Toaster } from './components/ui/toaster';
import Header from './components/Header';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <TransactionProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<ExpenseTrackerWireframes />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/process-sms" element={<ProcessSmsMessages />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
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
