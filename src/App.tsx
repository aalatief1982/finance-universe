import React, { useEffect, useState } from 'react';
import {
  Route,
  useNavigate,
  useLocation,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Outlet,
} from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import { Toaster } from "@/components/ui/toaster";
import ImportTransactions from './pages/ImportTransactions';
import ImportTransactionsNER from './pages/ImportTransactionsNER';
import EditTransaction from './pages/EditTransaction';
import TrainModel from '@/pages/TrainModel';
import BuildTemplate from '@/pages/BuildTemplate';
import KeywordBankManager from '@/pages/KeywordBankManager';
import TemplateHealthDashboard from '@/pages/DevTools/TemplateHealthDashboard';
import TemplateFailureLog from '@/pages/DevTools/TemplateFailureLog';
import ProcessSmsMessages from '@/pages/ProcessSmsMessages';
import CustomParsingRules from '@/pages/CustomParsingRules';
import ProcessVendors from '@/pages/sms/ProcessVendors';
import VendorCategorization from '@/pages/sms/VendorCategorization';
import VendorMapping from '@/pages/VendorMapping';
import ReviewSmsTransactions from '@/pages/ReviewSmsTransactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AccountsPage from './pages/budget/AccountsPage';
import SetBudgetPage from './pages/budget/SetBudgetPage';
import BudgetReportPage from './pages/budget/BudgetReportPage';
import BudgetInsightsPage from './pages/budget/BudgetInsightsPage';
import ScrollToTop from './components/layout/ScrollToTop';


import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { parseSmsMessage } from '@/lib/sms-parser';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import SmsImportService from '@/services/SmsImportService';
import { ENABLE_SMS_INTEGRATION } from '@/lib/env';
import { useUser } from './context/UserContext';
import SmartPasteReviewQueueModal from '@/components/sms/SmartPasteReviewQueueModal';
import { getQueuedMessages, clearQueuedMessages } from '@/services/smsQueueService';

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const showOnboarding = localStorage.getItem('xpensia_onb_done') !== 'true';
  const navigateRef = React.useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  const { user } = useUser();
  const [queueOpen, setQueueOpen] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<{ sender: string; body: string }[]>([]);

  useEffect(() => {
    const checkQueue = async () => {
      const msgs = await getQueuedMessages();
      if (msgs.length > 0) {
        setQueuedMessages(msgs);
        setQueueOpen(true);
      }
    };

    checkQueue();
    const resume = CapacitorApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        checkQueue();
      }
    });
    return () => {
      resume.then(listener => listener.remove());
    };
  }, []);

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      if (process.env.NODE_ENV === 'development') console.log('[SMS] Web platform — skipping setupSmsListener entirely.');
      return;
    }

    const setupSmsListener = async () => {
      try {
        if (process.env.NODE_ENV === 'development') console.log('[SMS] Setting up listener...');
        
        if (platform === 'android') {
          if (process.env.NODE_ENV === 'development') console.log('[INIT] Native platform detected. Setting up status bar...');
          try {
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            await StatusBar.setStyle({ style: Style.Light });
          } catch (err) {
            console.error('[STATUS] Error setting up status bar:', err);
          }
        }
        
        try {
          // Check permission first
          const permissionResult = await BackgroundSmsListener.checkPermission();
          if (process.env.NODE_ENV === 'development') console.log('[SMS] Permission check result:', permissionResult);
          
          if (!permissionResult.granted) {
            if (process.env.NODE_ENV === 'development') console.log('[SMS] Permission not granted. Requesting permission...');
            const requestResult = await BackgroundSmsListener.requestPermission();
            if (process.env.NODE_ENV === 'development') console.log('[SMS] Permission request result:', requestResult);
            
            if (!requestResult.granted) {
              if (process.env.NODE_ENV === 'development') console.log('[SMS] Permission denied. Cannot proceed with SMS listener.');
              return;
            }
          }
          
          if (process.env.NODE_ENV === 'development') console.log('[SMS] Starting to listen for SMS...');
          if (process.env.NODE_ENV === 'development') console.log('AIS-03 starting listener');
          try {
            await BackgroundSmsListener.startListening();
            if (process.env.NODE_ENV === 'development') console.log('[SMS] Successfully started listening for SMS messages');
          } catch (err) {
            if (process.env.NODE_ENV === 'development') console.warn('[SMS] Error starting SMS listener:', err);
          }
          
          // Add listener for SMS events with error handling
          try {
            const listener = await BackgroundSmsListener.addListener('smsReceived', async ({ sender, body }) => {
              if (process.env.NODE_ENV === 'development') console.log('[Xpensia SMS] Received:', sender, body);

              if (!isFinancialTransactionMessage(body)) {
                if (process.env.NODE_ENV === 'development') console.log('[Xpensia SMS] Not a financial message. Skipped.');
                return;
              }

              const parsed = parseSmsMessage(body, sender);

              const txn: Transaction = {
                id: uuidv4(),
                title: parsed?.description || `SMS from ${sender}`,
                amount: parsed?.amount ?? 0,
                category: parsed?.category || 'Uncategorized',
                type: parsed?.type || (parsed?.amount && parsed.amount < 0 ? 'expense' : 'income'),
                date: parsed?.date
                  ? parsed.date.toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0],
                source: 'sms',
                fromAccount: parsed?.fromAccount || sender,
                toAccount: parsed?.toAccount,
                details: {
                  sms: {
                    sender,
                    message: body,
                    timestamp: new Date().toISOString()
                  },
                  rawMessage: body
                },
                currency: parsed?.currency || 'SAR',
                country: parsed?.country,
                description: parsed?.description
              };

              // Handle background state
              const appState = await CapacitorApp.getState();
              if (appState.isActive) {
                if (process.env.NODE_ENV === 'development') console.log('[NOTIFY] App active. Navigating to transaction.');
                navigate('/edit-transaction', { state: { transaction: txn } });
              } else {
                if (process.env.NODE_ENV === 'development') console.log('[NOTIFY] App backgrounded. Showing notification.');
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      id: 777,
                      title: 'New Transaction Detected',
                      body: 'Tap to review and confirm',
                      schedule: { at: new Date(Date.now() + 1000) },
                      extra: { transaction: txn }
                    }
                  ]
                });
              }
            });
            if (process.env.NODE_ENV === 'development') console.log('[SMS] Successfully added SMS listener');
          } catch (err) {
            console.error('[SMS] Error adding SMS listener:', err);
          }
          
          // Handle notification taps
          LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
            const statePayload = event.notification.extra;
            if (statePayload?.transaction) {
              if (process.env.NODE_ENV === 'development') console.log('[NOTIFICATION] Tapped. Redirecting to edit.');
              navigate('/edit-transaction', { state: statePayload });
            }
          });
          
        } catch (err) {
          console.error('[SMS] Error in SMS listener setup:', err);
        }
        
      } catch (error) {
        console.error('[SMS] Error setting up listener:', error);
      }
    };

    setupSmsListener();
    return () => {
      if (process.env.NODE_ENV === 'development') console.log('AIS-04 stopping listener');
      BackgroundSmsListener.stopListening().catch(err => {
        if (process.env.NODE_ENV === 'development') console.warn('[SMS] Error stopping SMS listener:', err);
      });
    };
  }, [navigate]);

  useEffect(() => {
    if (!ENABLE_SMS_INTEGRATION) return;
    if (user?.preferences?.sms?.autoImport) {
      SmsImportService.checkForNewMessages(navigateRef.current, { auto: true });
    }
  }, [user]);

  useEffect(() => {
    if (showOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [showOnboarding, location.pathname, navigate]);

  return (
    <>
      <ScrollToTop />
      <Outlet />
      <SmartPasteReviewQueueModal
        open={queueOpen}
        messages={queuedMessages}
        onClose={() => {
          clearQueuedMessages();
          setQueueOpen(false);
          setQueuedMessages([]);
        }}
      />
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppWrapper />}>
      <Route index element={<Home />} />
      <Route path="home" element={<Home />} />
      <Route path="transactions" element={<Transactions />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="profile" element={<Profile />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="import-transactions" element={<ImportTransactions />} />
      <Route path="import-transactions-ner" element={<ImportTransactionsNER />} />
      <Route path="edit-transaction" element={<EditTransaction />} />
      <Route path="edit-transaction/:id" element={<EditTransaction />} />
      <Route path="train-model" element={<TrainModel />} />
      <Route path="build-template" element={<BuildTemplate />} />
      <Route path="keyword-bank" element={<KeywordBankManager />} />
      {process.env.NODE_ENV === 'development' && (
        <>
          <Route path="dev/template-health" element={<TemplateHealthDashboard />} />
          <Route path="dev/template-failures" element={<TemplateFailureLog />} />
        </>
      )}
      <Route path="custom-parsing-rules" element={<CustomParsingRules />} />
      <Route path="settings" element={<Settings />} />
      <Route path="process-sms" element={<ProcessSmsMessages />} />
      <Route path="sms/process-vendors" element={<ProcessVendors />} />
      <Route path="sms/vendors" element={<VendorCategorization />} />
      <Route path="vendor-mapping" element={<VendorMapping />} />
      <Route path="review-sms-transactions" element={<ReviewSmsTransactions />} />
      <Route path="budget/accounts" element={<AccountsPage />} />
      <Route path="budget/set" element={<SetBudgetPage />} />
      <Route path="budget/report" element={<BudgetReportPage />} />
      <Route path="budget/insights" element={<BudgetInsightsPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <UserProvider>
        <TransactionProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TransactionProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
