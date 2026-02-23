import { safeStorage } from "@/utils/safe-storage";
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { appUpdateService } from '@/services/AppUpdateService';
import { ThemeProvider } from "@/components/theme-provider";
import { fixCorruptedCurrencyCodes } from '@/utils/migration/fixCurrencyCodes';
import { migrateFxFields } from '@/utils/migration/migrateFxFields';
import { cleanExpiredRates } from '@/utils/fx/fx-cache';
import Home from './pages/Home';

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
import SmsProviderSelection from '@/pages/SmsProviderSelection';
import CustomParsingRules from '@/pages/CustomParsingRules';
import ProcessVendors from '@/pages/sms/ProcessVendors';
import VendorCategorization from '@/pages/sms/VendorCategorization';
import VendorMapping from '@/pages/VendorMapping';
import ReviewSmsTransactions from '@/pages/ReviewSmsTransactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import About from './pages/About';
import AccountsPage from './pages/budget/AccountsPage';
import SetBudgetPage from './pages/budget/SetBudgetPage';
import BudgetReportPage from './pages/budget/BudgetReportPage';
import BudgetInsightsPage from './pages/budget/BudgetInsightsPage';
import BudgetHubPage from './pages/budget/BudgetHubPage';
import BudgetDetailPage from './pages/budget/BudgetDetailPage';
import ExchangeRates from './pages/ExchangeRates';
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
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';
import { getNextSmsFlowStep, resolveProviderSelectionState, type OnboardingState, type SmsPermissionState } from '@/services/SmsFlowCoordinator';
import { migrateSmsFlowSchema } from '@/services/SmsFlowMigrationService';
import {
  ENABLE_SMS_INTEGRATION,
  consumeSmsSenderFirstFlowV2RollbackToggle,
  isSmsSenderFirstFlowV2Enabled,
} from '@/lib/env';
import { useUser } from './context/UserContext';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { toast } from '@/components/ui/use-toast';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { UpdateDialog } from '@/components/UpdateDialog';
import SmsPermissionPrompt from '@/components/SmsPermissionPrompt';
import { useTheme } from 'next-themes';
import { trackNavigationPath } from '@/utils/navigation';

const TRACE_PREFIX = '[TRACE][APP_ROOT]';
const traceAppRoot = (message: string, ...args: unknown[]) => {
  const now = performance.now().toFixed(2);
  console.log(`${TRACE_PREFIX}[${now}ms] ${message}`, ...args);
};

const traceState = (message: string, payload?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (payload) {
    console.log(`[TRACE][STATE][${timestamp}] ${message}`, payload);
    return;
  }

  console.log(`[TRACE][STATE][${timestamp}] ${message}`);
};

// Synchronous onboarding guard - use render-time redirect to avoid route flash.
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const done = safeStorage.getItem('xpensia_onb_done') === 'true';
  if (!done) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

function AppWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = React.useRef(navigate);
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const hasScheduledSmsPrompt = React.useRef(false);
  const { theme, resolvedTheme } = useTheme();
  const previousPathRef = React.useRef(location.pathname);
  const startupSnapshotLoggedRef = React.useRef(false);
  const previousThemeRef = React.useRef<{ theme?: string; resolvedTheme?: string }>({
    theme,
    resolvedTheme,
  });
  const previousThemeTraceRef = React.useRef<{ theme?: string; resolvedTheme?: string }>({
    theme,
    resolvedTheme,
  });
  const { user, auth } = useUser();

  traceState('AppWrapper render state', {
    pathname: location.pathname,
    theme,
    resolvedTheme,
  });

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      traceState('location.pathname transition detected', {
        from: previousPathRef.current,
        to: location.pathname,
      });
      previousPathRef.current = location.pathname;
      return;
    }

    traceState('location.pathname stable on effect run', {
      pathname: location.pathname,
    });
  }, [location.pathname]);

  useEffect(() => {
    traceState('theme state transition check', {
      previousTheme: previousThemeTraceRef.current.theme,
      previousResolvedTheme: previousThemeTraceRef.current.resolvedTheme,
      theme,
      resolvedTheme,
    });

    previousThemeTraceRef.current = {
      theme,
      resolvedTheme,
    };
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (!location.pathname.startsWith('/onboarding') || startupSnapshotLoggedRef.current) {
      return;
    }

    startupSnapshotLoggedRef.current = true;
    const timestamp = new Date().toISOString();
    console.groupCollapsed(`[TRACE][STATE][${timestamp}] startup snapshot`);
    console.log('pathname', location.pathname);
    console.log('onboardingDone', safeStorage.getItem('xpensia_onb_done') === 'true');
    console.log('theme', theme);
    console.log('resolvedTheme', resolvedTheme);
    console.log('auth.isLoading', auth.isLoading);
    console.log('auth.isAuthenticated', auth.isAuthenticated);
    console.log('user.id', user?.id ?? null);
    console.groupEnd();
  }, [auth.isAuthenticated, auth.isLoading, location.pathname, resolvedTheme, theme, user?.id]);

  const isDarkModeActive = React.useCallback(() => {
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        return true;
      }
      if (document.documentElement.classList.contains('light')) {
        return false;
      }
    }

    if (resolvedTheme === 'dark') return true;
    if (resolvedTheme === 'light') return false;

    if (theme === 'dark') return true;
    if (theme === 'light') return false;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }, [resolvedTheme, theme]);

  const applyStatusBarAppearance = React.useCallback(async ({ onboarding }: { onboarding: boolean }) => {
    const darkMode = isDarkModeActive();
    const statusBarBackgroundColor = onboarding
      ? (darkMode ? '#06263b' : '#0097a0')
      : (darkMode ? '#020817' : '#0097a0');

    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: statusBarBackgroundColor });
    await StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light });
  }, [isDarkModeActive]);

  const applyOnboardingStatusBar = React.useCallback(async () => {
    await applyStatusBarAppearance({ onboarding: true });
  }, [applyStatusBarAppearance]);

  const applyDefaultStatusBar = React.useCallback(async () => {
    await applyStatusBarAppearance({ onboarding: false });
  }, [applyStatusBarAppearance]);

  const applyStatusBarForRoute = React.useCallback(async (pathname: string) => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // Single owner for status bar state:
      // - entering onboarding route: AppWrapper applies onboarding status bar state
      // - leaving onboarding route: AppWrapper restores default app status bar state
      // - normal routes: AppWrapper keeps default app status bar state
      if (pathname === '/onboarding') {
        await applyOnboardingStatusBar();
        return;
      }

      await applyDefaultStatusBar();
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[STATUS] Error applying route status bar state:', err);
      }
    }
  }, [applyDefaultStatusBar, applyOnboardingStatusBar]);

  useEffect(() => {
    void applyStatusBarForRoute(location.pathname);
  }, [applyStatusBarForRoute, location.pathname]);

  useEffect(() => {
    trackNavigationPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const hasThemeContext = typeof theme !== 'undefined' || typeof resolvedTheme !== 'undefined';

    if (hasThemeContext) {
      const previousTheme = previousThemeRef.current;
      const didThemeChange = previousTheme.theme !== theme || previousTheme.resolvedTheme !== resolvedTheme;

      previousThemeRef.current = { theme, resolvedTheme };

      if (didThemeChange) {
        void applyStatusBarForRoute(location.pathname);
      }

      return;
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      void applyStatusBarForRoute(location.pathname);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [applyStatusBarForRoute, location.pathname, resolvedTheme, theme]);

  // SMS Auto-Import functionality - placeholder for future queue functionality if needed

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS] Web platform — skipping setupSmsListener entirely.');
      }
      return;
    }

    const setupSmsListener = async () => {
      try {
        if (import.meta.env.MODE === 'development') {
          // console.log('[SMS] Setting up listener...');
        }
        
        try {
          // Check permission first - only proceed if already granted
          const permissionResult = await BackgroundSmsListener.checkPermission();
          if (import.meta.env.MODE === 'development') {
            // console.log('[SMS] Permission check result:', permissionResult);
          }
          
          if (!permissionResult.granted) {
            if (import.meta.env.MODE === 'development') {
              // console.log('[SMS] Permission not granted. SMS listener will not be set up. User can enable via Settings.');
            }
            return;
          }
          
          if (import.meta.env.MODE === 'development') {
            // console.log('[SMS] Permission already granted. Setting up SMS listener.');
          }
          
          if (import.meta.env.MODE === 'development') {
            // console.log('[SMS] Starting to listen for SMS...');
          }
          if (import.meta.env.MODE === 'development') {
            // console.log('AIS-03 starting listener');
          }
          try {
            await BackgroundSmsListener.startListening();
            if (import.meta.env.MODE === 'development') {
              // console.log('[SMS] Successfully started listening for SMS messages');
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
                // console.log('[Xpensia SMS] Received from', sender, ':', body);
              }

              if (!isFinancialTransactionMessage(body)) {
                if (import.meta.env.MODE === 'development') {
                  // console.log('[Xpensia SMS] Not a financial message. Skipped.');
                }
                return;
              }

              if (import.meta.env.MODE === 'development') {
                // console.log('[Xpensia SMS] Processing financial SMS from any sender:', sender);
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
                  // console.log('[NOTIFY] App active. Navigating to transaction.');
                }
                navigate('/edit-transaction', { state: { transaction: txn } });
              } else {
                if (import.meta.env.MODE === 'development') {
                  // console.log('[NOTIFY] App backgrounded. Showing notification.');
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
              // console.log('[SMS] Successfully added SMS listener');
            }
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.error('[SMS] Error adding SMS listener:', err);
            }
          }
          
          // Handle notification taps
          LocalNotifications.addListener('localNotificationActionPerformed', async (event: { notification: { extra?: { smsData?: { sender: string; body: string } } } }) => {
            const statePayload = event.notification.extra;
            if (statePayload?.smsData) {
              if (import.meta.env.MODE === 'development') {
                // console.log('[NOTIFICATION] Tapped. Processing SMS directly.');
              }
              
              const { sender, body } = statePayload.smsData;
              
              try {
                // Process SMS using the same backend function as SmartPaste
                const result = await parseAndInferTransaction(body, sender);
                
                if (import.meta.env.MODE === 'development') {
                  // console.log('[NOTIFICATION] SMS processed:', result);
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
        // console.log('AIS-04 stopping listener');
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
    let isCancelled = false;

    const runStartupSmsFlow = async () => {
      const onboardingState: OnboardingState =
        safeStorage.getItem('xpensia_onb_done') === 'true'
          ? (safeStorage.getItem('xpensia_onb_just_completed') === 'true'
            ? 'first_run_post_onboarding'
            : 'subsequent_run')
          : 'not_completed';

      const { smsPermissionService } = await import('@/services/SmsPermissionService');
      const permissionStatus = await smsPermissionService.checkPermissionStatus();
      const permissionState: SmsPermissionState = permissionStatus.granted ? 'granted' : 'not_granted';

      const smsSenderFirstFlowV2Enabled = isSmsSenderFirstFlowV2Enabled();
      const rollbackToLegacyRoutingOnce = consumeSmsSenderFirstFlowV2RollbackToggle();

      if (smsSenderFirstFlowV2Enabled) {
        const migrationResult = await migrateSmsFlowSchema();
        if (!migrationResult.ok) {
          safeStorage.setItem('xpensia_sms_flow_read_only', 'true');
          toast({
            variant: 'destructive',
            title: 'SMS import is temporarily in read-only mode',
            description: 'We could not complete SMS flow migration. You can review senders, but imports are paused until this is resolved.',
          });
          navigateRef.current('/process-sms');
          return;
        }

        safeStorage.removeItem('xpensia_sms_flow_read_only');
      }

      await smsProviderSelectionService.hydrateProvidersFromStableStorage();
      const providerSelectionState = resolveProviderSelectionState(user?.smsProviders);

      const flowDecision = getNextSmsFlowStep({
        onboardingState,
        permissionState,
        providerSelectionState,
        autoImportEnabled: Boolean(user?.preferences?.sms?.autoImport),
        smsSenderFirstFlowV2Enabled,
        rollbackToLegacyRoutingOnce,
      });

      if (isCancelled) return;

      if (flowDecision.nextStep === 'route_sender_discovery' && flowDecision.route && location.pathname !== flowDecision.route) {
        navigateRef.current(flowDecision.route);
        return;
      }

      if (flowDecision.shouldTriggerAutoImport) {
        SmsImportService.checkForNewMessages(navigateRef.current, {
          auto: true,
          usePermissionDate: true,
        });
      }
    };

    void runStartupSmsFlow();

    return () => {
      isCancelled = true;
    };
  }, [user, location.pathname]);



  useEffect(() => {
    const checkAndMaybeShowSmsPrompt = async () => {
      // Prevent double-scheduling
      if (hasScheduledSmsPrompt.current) return;

      const justCompleted = safeStorage.getItem('xpensia_onb_just_completed') === 'true';
      if (!justCompleted) return;

      const isNative = Capacitor.isNativePlatform();
      const isAndroid = Capacitor.getPlatform() === 'android';
      const alreadyPrompted = safeStorage.getItem('sms_prompt_shown') === 'true';

      console.log('[App] SMS prompt check:', { justCompleted, isNative, isAndroid, alreadyPrompted });

      if (!isNative || !isAndroid || alreadyPrompted) {
        safeStorage.removeItem('xpensia_onb_just_completed');
        return;
      }

      // Check canonical permission - if already granted, don't show prompt
      try {
        const { smsPermissionService } = await import('@/services/SmsPermissionService');
        const permissionStatus = await smsPermissionService.checkPermissionStatus();
        console.log('[App] Canonical permission status:', permissionStatus);

        if (permissionStatus.granted) {
          safeStorage.setItem('sms_prompt_shown', 'true');
          safeStorage.removeItem('xpensia_onb_just_completed');
          console.log('[App] Permission already granted, skipping prompt');
          return;
        }
      } catch (e) {
        console.warn('[App] Error checking permission status:', e);
      }

      // Mark as scheduled to prevent double-triggering
      hasScheduledSmsPrompt.current = true;

      setTimeout(() => {
        // Clear flag only when actually showing prompt
        safeStorage.removeItem('xpensia_onb_just_completed');
        console.log('[App] Showing SMS permission prompt');
        setShowSmsPrompt(true);
      }, 3000);
    };

    checkAndMaybeShowSmsPrompt();
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <SmsPermissionPrompt 
        open={showSmsPrompt} 
        onOpenChange={setShowSmsPrompt} 
      />
    </>
  );
}

function AppRoutes() {
  const onboardingDone = safeStorage.getItem('xpensia_onb_done') === 'true';
  const location = useLocation();
  const previousOnboardingDoneRef = React.useRef(onboardingDone);

  traceAppRoot(`AppRoutes render pathname=${location.pathname} onboardingDone=${onboardingDone}`);
  traceState('AppRoutes render flags', {
    onboardingDone,
    pathname: location.pathname,
  });

  React.useEffect(() => {
    if (previousOnboardingDoneRef.current !== onboardingDone) {
      traceState('onboardingDone transition detected', {
        from: previousOnboardingDoneRef.current,
        to: onboardingDone,
        pathname: location.pathname,
      });
      previousOnboardingDoneRef.current = onboardingDone;
      return;
    }

    traceState('onboardingDone stable on effect run', {
      value: onboardingDone,
      pathname: location.pathname,
    });
  }, [location.pathname, onboardingDone]);

  if (onboardingDone && location.pathname.startsWith('/onboarding')) {
    traceAppRoot('AppRoutes redirect branch selected: /onboarding* -> /home');
    return (
      <>
        <AppWrapper />
        <Navigate to="/home" replace />
      </>
    );
  }

  return (
    <>
      <AppWrapper />
      <Routes>
        <Route
          path="/"
          element={(
            traceAppRoot(`AppRoutes redirect route "/" -> ${onboardingDone ? '/home' : '/onboarding'}`),
            <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />
          )}
        />
        <Route
          path="/home"
          element={
            <OnboardingGuard>
              <ErrorBoundary name="Home Page">
                <Home />
              </ErrorBoundary>
            </OnboardingGuard>
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
              {onboardingDone
                ? (traceAppRoot('AppRoutes redirect route "/onboarding" -> /home'), <Navigate to="/home" replace />)
                : <Onboarding />}
            </ErrorBoundary>
          }
        />
        <Route
          path="/onboarding/*"
          element={(
            traceAppRoot(`AppRoutes redirect route "/onboarding/*" -> ${onboardingDone ? '/home' : '/onboarding'}`),
            <Navigate to={onboardingDone ? '/home' : '/onboarding'} replace />
          )}
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
        {/* Canonical SMS flow order: /process-sms -> /vendor-mapping -> /review-sms-transactions */}
        <Route path="/process-sms" element={<ProcessSmsMessages />} />
        <Route
          path="/sms-providers"
          element={
            <OnboardingGuard>
              <SmsProviderSelection />
            </OnboardingGuard>
          }
        />
        <Route path="/sms/process-vendors" element={<ProcessVendors />} />
        <Route path="/sms/vendors" element={<VendorCategorization />} />
        <Route path="/vendor-mapping" element={<VendorMapping />} />
        <Route path="/review-sms-transactions" element={<ReviewSmsTransactions />} />
        <Route path="/exchange-rates" element={<ExchangeRates />} />
        <Route path="/budget" element={<BudgetHubPage />} />
        <Route path="/budget/:budgetId" element={<BudgetDetailPage />} />
        <Route path="/budget/accounts" element={<AccountsPage />} />
        <Route path="/budget/set" element={<SetBudgetPage />} />
        <Route path="/budget/report" element={<BudgetReportPage />} />
        <Route path="/budget/insights" element={<BudgetInsightsPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    traceAppRoot('App mounted');

    return () => {
      traceAppRoot('App unmounted');
    };
  }, []);

  useEffect(() => {
    const logClassDiagnostics = (source: string) => {
      const rootElement = document.getElementById('root');
      console.log('[TRACE][APP_ROOT] class/style mutation detected', {
        source,
        documentElementClassName: document.documentElement.className,
        bodyClassName: document.body.className,
        rootClassName: rootElement?.className ?? null,
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== 'attributes') {
          return;
        }

        const target = mutation.target as Element;
        const targetLabel =
          target === document.documentElement
            ? 'document.documentElement'
            : target === document.body
              ? 'document.body'
              : target.id === 'root'
                ? '#root'
                : target.tagName.toLowerCase();

        logClassDiagnostics(`${targetLabel}.${mutation.attributeName}`);
      });
    });

    const targets: Element[] = [document.documentElement, document.body];
    const rootElement = document.getElementById('root');
    if (rootElement) {
      targets.push(rootElement);
    }

    targets.forEach((target) => {
      observer.observe(target, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const { updateStatus, showDialog, setShowDialog } = useAppUpdate({ 
    checkOnMount: true,
    checkInterval: 1000 * 60 * 60 // Check hourly
  });

  // Run migrations and cache cleanup on startup
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      
      // Legacy currency code migration
      fixCorruptedCurrencyCodes();
      
      // FX fields migration (adds baseCurrency, amountInBase, etc. to existing transactions)
      migrateFxFields();
      
      // Clean expired FX rates from cache
      cleanExpiredRates();
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[Migration] Startup migrations failed:', error);
      }
    }
  }, []);

  // Initialize Capgo updater on app start
  // (AppUpdateService has built-in retry if the bridge isn't ready yet)
  useEffect(() => {
    appUpdateService.initialize();
  }, []);

  // Apply pending OTA bundle when app is backgrounded (not during active use)
  // This prevents the reload from disrupting user sessions
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | null = null;
    
    CapacitorApp.addListener('appStateChange', async (state) => {
      if (!state.isActive) {
        // console.log('[OTA] App backgrounded, checking for pending bundle...');
        const hasPending = await appUpdateService.hasPendingBundle();
        if (hasPending) {
          // console.log('[OTA] Applying pending bundle on background...');
          await appUpdateService.applyPendingBundle();
        }
      }
    }).then(l => { listener = l; });

    return () => { listener?.remove(); };
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
