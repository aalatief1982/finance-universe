import { safeStorage } from "@/utils/safe-storage";
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { appUpdateService } from '@/services/AppUpdateService';
import { ThemeProvider } from "@/components/theme-provider";
import { fixCorruptedCurrencyCodes } from '@/utils/migration/fixCurrencyCodes';
import Home from './pages/Home';

// Run currency code migration on app startup
fixCorruptedCurrencyCodes();
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import { UserProvider } from './context/UserContext';
import { TransactionProvider } from './context/TransactionContext';
import { Toaster } from "@/components/ui/toaster";
import ImportTransactions from './pages/ImportTransactions';
import EditTransaction from './pages/EditTransaction';
import TrainModel from '@/pages/TrainModel';
import BuildTemplate from '@/pages/BuildTemplate';
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
import BudgetHubPage from './pages/budget/BudgetHubPage';
import BudgetDetailPage from './pages/budget/BudgetDetailPage';
import ScrollToTop from './components/layout/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';


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
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { toast } from '@/components/ui/use-toast';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { UpdateDialog } from '@/components/UpdateDialog';

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const showOnboarding = safeStorage.getItem('xpensia_onb_done') !== 'true';
  const navigateRef = React.useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  const { user } = useUser();

  // SMS Auto-Import functionality - placeholder for future queue functionality if needed

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Web platform — skipping setupSmsListener entirely.');
      }
      return;
    }

    const setupSmsListener = async () => {
      try {
        if (import.meta.env.MODE === 'development') {
          console.log('[SMS] Setting up listener...');
        }
        
        if (platform === 'android') {
          if (import.meta.env.MODE === 'development') {
            console.log('[INIT] Native platform detected. Setting up status bar...');
          }
          try {
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            await StatusBar.setStyle({ style: Style.Light });
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.error('[STATUS] Error setting up status bar:', err);
            }
          }
        }
        
        try {
          // Check permission first - only proceed if already granted
          const permissionResult = await BackgroundSmsListener.checkPermission();
          if (import.meta.env.MODE === 'development') {
            console.log('[SMS] Permission check result:', permissionResult);
          }
          
          if (!permissionResult.granted) {
            if (import.meta.env.MODE === 'development') {
              console.log('[SMS] Permission not granted. SMS listener will not be set up. User can enable via Settings.');
            }
            return;
          }
          
          if (import.meta.env.MODE === 'development') {
            console.log('[SMS] Permission already granted. Setting up SMS listener.');
          }
          
          if (import.meta.env.MODE === 'development') {
            console.log('[SMS] Starting to listen for SMS...');
          }
          if (import.meta.env.MODE === 'development') {
            console.log('AIS-03 starting listener');
          }
          try {
            await BackgroundSmsListener.startListening();
            if (import.meta.env.MODE === 'development') {
              console.log('[SMS] Successfully started listening for SMS messages');
            }
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.warn('[SMS] Error starting SMS listener:', err);
            }
          }
          
          // Add listener for SMS events with error handling
          try {
            const listener = await BackgroundSmsListener.addListener('smsReceived', async ({ sender, body }) => {
              if (import.meta.env.MODE === 'development') {
                console.log('[Xpensia SMS] Received from', sender, ':', body);
              }

              if (!isFinancialTransactionMessage(body)) {
                if (import.meta.env.MODE === 'development') {
                  console.log('[Xpensia SMS] Not a financial message. Skipped.');
                }
                return;
              }

              if (import.meta.env.MODE === 'development') {
                console.log('[Xpensia SMS] Processing financial SMS from any sender:', sender);
              }

              let parsed;
              try {
                parsed = parseSmsMessage(body, sender);
              } catch (err) {
                if (import.meta.env.MODE === 'development') {
                  console.error('[SMS] Error parsing message:', err)
                }
                toast({
                  title: 'Unable to auto-parse. Please review manually.'
                });
                navigate('/edit-transaction', { state: { rawMessage: body } });
                return;
              }

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
              }

              // Handle background state
              const appState = await CapacitorApp.getState();
              if (appState.isActive) {
                if (import.meta.env.MODE === 'development') {
                  console.log('[NOTIFY] App active. Navigating to transaction.');
                }
                navigate('/edit-transaction', { state: { transaction: txn } });
              } else {
                if (import.meta.env.MODE === 'development') {
                  console.log('[NOTIFY] App backgrounded. Showing notification.');
                }
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      id: 777,
                      title: 'New Transaction Detected',
                      body: 'Review and confirm your latest expense now!',
                      schedule: { at: new Date(Date.now() + 1000) },
                      extra: { 
                        smsData: { sender, body }
                      },
                      iconColor: '#0097a0',
                      smallIcon: 'ic_launcher'
                    }
                  ]
                });
              }
            });
            if (import.meta.env.MODE === 'development') {
              console.log('[SMS] Successfully added SMS listener');
            }
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.error('[SMS] Error adding SMS listener:', err);
            }
          }
          
          // Handle notification taps
          LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
            const statePayload = event.notification.extra;
            if (statePayload?.smsData) {
              if (import.meta.env.MODE === 'development') {
                console.log('[NOTIFICATION] Tapped. Processing SMS directly.');
              }
              
              const { sender, body } = statePayload.smsData;
              
              try {
                // Process SMS using the same backend function as SmartPaste
                const result = await parseAndInferTransaction(body, sender);
                
                if (import.meta.env.MODE === 'development') {
                  console.log('[NOTIFICATION] SMS processed:', result);
                }
                
                // Navigate to edit-transaction with the same state structure as ImportTransactions
                navigate('/edit-transaction', {
                  state: {
                    transaction: {
                      ...result.transaction,
                      rawMessage: body,
                    },
                    rawMessage: body,
                    senderHint: sender,
                    confidence: result.confidence,
                    matchedCount: result.matchedCount,
                    totalTemplates: result.totalTemplates,
                    fieldScore: result.fieldScore,
                    keywordScore: result.keywordScore,
                    isSuggested: true,
                    matchOrigin: result.origin,
                  },
                });
              } catch (error) {
                if (import.meta.env.MODE === 'development') {
                  console.error('[NOTIFICATION] Error processing SMS:', error);
                }
                // Fallback to import transactions page if processing fails
                navigate('/import-transactions');
              }
            }
          });
          
        } catch (err) {
          if (import.meta.env.MODE === 'development') {
            console.error('[SMS] Error in SMS listener setup:', err);
          }
        }
        
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('[SMS] Error setting up listener:', error);
        }
      }
    };

    setupSmsListener();
    return () => {
      if (import.meta.env.MODE === 'development') {
        console.log('AIS-04 stopping listener');
      }
      BackgroundSmsListener.stopListening().catch(err => {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Error stopping SMS listener:', err);
        }
      });
    };
  }, [navigate]);

  useEffect(() => {
    if (!ENABLE_SMS_INTEGRATION) return;
    if (user?.preferences?.sms?.autoImport) {
      // Use permission-based date for automatic import
      SmsImportService.checkForNewMessages(navigateRef.current, { 
        auto: true, 
        usePermissionDate: true 
      });
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
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <AppWrapper />
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary name="Home Page">
              <Home />
            </ErrorBoundary>
          }
        />
        <Route
          path="/home"
          element={
            <ErrorBoundary name="Home Page">
              <Home />
            </ErrorBoundary>
          }
        />
        <Route
          path="/transactions"
          element={
            <ErrorBoundary name="Transactions Page">
              <Transactions />
            </ErrorBoundary>
          }
        />
        <Route
          path="/analytics"
          element={
            <ErrorBoundary name="Analytics Page">
              <Analytics />
            </ErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <ErrorBoundary name="Profile Page">
              <Profile />
            </ErrorBoundary>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ErrorBoundary name="Onboarding Page">
              <Onboarding />
            </ErrorBoundary>
          }
        />
        <Route
          path="/import-transactions"
          element={
            <ErrorBoundary name="Import Transactions Page">
              <ImportTransactions />
            </ErrorBoundary>
          }
        />
        <Route
          path="/edit-transaction"
          element={
            <ErrorBoundary name="Edit Transaction Page">
              <EditTransaction />
            </ErrorBoundary>
          }
        />
        <Route
          path="/edit-transaction/:id"
          element={
            <ErrorBoundary name="Edit Transaction Page">
              <EditTransaction />
            </ErrorBoundary>
          }
        />
        <Route
          path="/train-model"
          element={
            <ErrorBoundary name="Train Model Page">
              <TrainModel />
            </ErrorBoundary>
          }
        />
        <Route
          path="/build-template"
          element={
            <ErrorBoundary name="Build Template Page">
              <BuildTemplate />
            </ErrorBoundary>
          }
        />
        <Route
          path="/custom-parsing-rules"
          element={
            <ErrorBoundary name="Custom Parsing Rules Page">
              <CustomParsingRules />
            </ErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary name="Settings Page">
              <Settings />
            </ErrorBoundary>
          }
        />
        <Route path="/process-sms" element={<ProcessSmsMessages />} />
        <Route path="/sms/process-vendors" element={<ProcessVendors />} />
        <Route path="/sms/vendors" element={<VendorCategorization />} />
        <Route path="/vendor-mapping" element={<VendorMapping />} />
        <Route path="/review-sms-transactions" element={<ReviewSmsTransactions />} />
        <Route path="/budget" element={<BudgetHubPage />} />
        <Route path="/budget/:budgetId" element={<BudgetDetailPage />} />
        <Route path="/budget/accounts" element={<AccountsPage />} />
        <Route path="/budget/set" element={<SetBudgetPage />} />
        <Route path="/budget/report" element={<BudgetReportPage />} />
        <Route path="/budget/insights" element={<BudgetInsightsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  const { updateStatus, showDialog, setShowDialog } = useAppUpdate({ 
    checkOnMount: true,
    checkInterval: 1000 * 60 * 60 // Check hourly
  });

  // Initialize Capgo updater on app start (delayed to ensure bridge is stable)
  useEffect(() => {
    const timer = setTimeout(() => {
      appUpdateService.initialize();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <UserProvider>
        <TransactionProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster />
          
          {/* OTA Update Dialog */}
          {updateStatus?.available && updateStatus.manifest && (
            <UpdateDialog
              open={showDialog}
              onOpenChange={setShowDialog}
              currentVersion={updateStatus.currentVersion}
              manifest={updateStatus.manifest}
              requiresStoreUpdate={updateStatus.requiresStoreUpdate}
            />
          )}
        </TransactionProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
