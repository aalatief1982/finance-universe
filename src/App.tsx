import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
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
import BuildTemplate from '@/pages/BuildTemplate';
import KeywordBankManager from '@/pages/KeywordBankManager';
import ProcessSmsMessages from '@/pages/ProcessSmsMessages';
import Signup from './pages/SignUp';
import Signin from './pages/SignIn';
import ProcessVendors from '@/pages/sms/ProcessVendors';
import VendorCategorization from '@/pages/sms/VendorCategorization';
import VendorMapping from '@/pages/VendorMapping';
import ReviewDraftTransactions from '@/pages/ReviewDraftTransactions';

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';

import { handleNotificationSmartPaste } from '@/lib/smart-paste-engine/notificationHandler';

function AppWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      console.log('[SMS] Web platform — skipping setupSmsListener entirely.');
      return;
    }

    const setupSmsListener = async () => {
      try {
        console.log('[SMS] Setting up listener...');
        
        if (platform === 'android') {
          console.log('[INIT] Native platform detected. Setting up status bar...');
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
          console.log('[SMS] Permission check result:', permissionResult);
          
          if (!permissionResult.granted) {
            console.log('[SMS] Permission not granted. Requesting permission...');
            const requestResult = await BackgroundSmsListener.requestPermission();
            console.log('[SMS] Permission request result:', requestResult);
            
            if (!requestResult.granted) {
              console.log('[SMS] Permission denied. Cannot proceed with SMS listener.');
              return;
            }
          }
          
          console.log('[SMS] Starting to listen for SMS...');
          try {
            await BackgroundSmsListener.startListening();
            console.log('[SMS] Successfully started listening for SMS messages');
          } catch (err) {
            console.warn('[SMS] Error starting SMS listener:', err);
          }
          
          // Add listener for SMS events with error handling
          try {
            const listener = await BackgroundSmsListener.addListener('smsReceived', async ({ sender, body }) => {
              console.log('[Xpensia SMS] Received:', sender, body);

              if (!isFinancialTransactionMessage(body)) {
                console.log('[Xpensia SMS] Not a financial message. Skipped.');
                return;
              }

              const { template, placeholders } = extractTemplateStructure(body);
              const txn: Transaction = {
                id: uuidv4(),
                title: `SMS from ${sender}`,
                amount: 0, // Will be extracted by the transaction processor
                category: 'Uncategorized',
                type: 'expense', // Default, will be determined by processor
                date: new Date().toISOString().split('T')[0],
                source: 'sms',
                fromAccount: sender,
                details: {
                  sms: {
                    sender,
                    message: body,
                    timestamp: new Date().toISOString()
                  },
                  rawMessage: body
                },
                currency: 'SAR' // Default currency, can be overridden by processor
              };

              // Handle background state
              const appState = await CapacitorApp.getState();
              if (appState.isActive) {
                console.log('[NOTIFY] App active. Navigating to transaction.');
                navigate('/edit-transaction', { state: { transaction: txn } });
              } else {
                console.log('[NOTIFY] App backgrounded. Showing notification.');
                
                async function ensureNotificationPermission() {
                const perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                  const req = await LocalNotifications.requestPermissions();
                  if (req.display !== 'granted') {
                    console.warn('[NOTIFY] Notification permission not granted');
                    return false;
                  }
                }
                return true;
              }

                  if (await ensureNotificationPermission()) {
                    await LocalNotifications.schedule({
                      notifications: [
                        {
                          title: 'New Transaction Detected',
                          body: 'Tap to review your latest expense',
                          id: parseInt(Date.now().toString().slice(-6)),
                          schedule: { at: new Date(Date.now() + 1000) },
                          sound: null,
                          attachments: null,
                          actionTypeId: "",
                           extra: { rawMessage: body }  // 👈 Add this line
                        },
                      ]
                    });
                  }


                /* await LocalNotifications.schedule({
                  notifications: [
                    {
                      id: 777,
                      title: 'New Transaction Detected',
                      body: 'Tap to review and confirm',
                      schedule: { at: new Date(Date.now() + 1000) },
                      extra: { transaction: txn }
                    }
                  ]
                }); */

              }
            });
            console.log('[SMS] Successfully added SMS listener');
          } catch (err) {
            console.error('[SMS] Error adding SMS listener:', err);
          }
          
          // Handle notification taps
      /*     LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
            const statePayload = event.notification.extra;
            if (statePayload?.transaction) {
              console.log('[NOTIFICATION] Tapped. Redirecting to edit.');
              navigate('/edit-transaction', { state: statePayload });
            }
          }); */
          LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
          const message = event.notification?.extra?.rawMessage || '';
          if (message) {
            console.log('[NOTIFICATION] Tap event:', event.notification);
            await handleNotificationSmartPaste(message,navigate);
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
  }, [navigate]);

  return (
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" attribute="class">
        <UserProvider>
          <TransactionProvider>
            <AppWrapper />
            <Toaster />
          </TransactionProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
