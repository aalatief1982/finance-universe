
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ExpenseTrackerWireframes from './components/wireframes/ExpenseTrackerWireframes';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ProcessSmsMessages from './pages/ProcessSmsMessages';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';

function App() {
  return (
    <UserProvider>
      <TransactionProvider>
        <Router>
          <Routes>
            <Route path="/" element={<ExpenseTrackerWireframes />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/process-sms" element={<ProcessSmsMessages />} />
          </Routes>
        </Router>
      </TransactionProvider>
    </UserProvider>
  );
}

export default App;
