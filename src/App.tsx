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
import { SMS_STARTUP_IMPORT_ENABLED } from '@/lib/envFlags';
import { useUser } from './context/UserContext';
import { toast } from '@/components/ui/use-toast';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { UpdateDialog } from '@/components/UpdateDialog';
import SmsPermissionPrompt from '@/components/SmsPermissionPrompt';
import { useTheme } from 'next-themes';
import { trackNavigationPath } from '@/utils/navigation';
import { isDefaultCurrencySelectionRequired } from '@/utils/default-currency';
import SetDefaultCurrency from '@/pages/SetDefaultCurrency';
import { ToastAction } from '@/components/ui/toast';
import { enqueueSms, getInboxCount } from '@/lib/sms-inbox/smsInboxQueue';

const HOME_ROUTE = '/home';
const IMPORT_ROUTE = '/import-transactions';
const SMS_STARTUP_IMPORT_DONE_KEY = 'xpensia_sms_startup_import_done';
const BLOCK_STARTUP_IMPORT_ROUTE = true;

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
  const startupSmsFlowRanRef = React.useRef(false);
  const { user, auth } = useUser();
  const onboardingDone = safeStorage.getItem('xpensia_onb_done') === 'true';

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

    const syncNativeInboxAndRoute = async () => {
      try {
        const drained = await BackgroundSmsListener.drainPersistedMessages();
        const messages = Array.isArray(drained?.messages) ? drained.messages : [];
        let enqueued = 0;
        for (const message of messages) {
          const beforeCount = getInboxCount();
          enqueueSms({
            sender: message.sender ?? '',
            body: message.body ?? '',
            receivedAt: message.receivedAt ? new Date(message.receivedAt).toISOString() : undefined,
            source: message.source === 'static_receiver' ? 'static_receiver' : 'listener',
          });
          if (getInboxCount() > beforeCount) {
            enqueued += 1;
          }
        }
        console.log(`[SMS] Drained persisted native messages: ${messages.length}, enqueued: ${enqueued}`);
      } catch (err) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Error draining persisted messages:', err);
        }
      }

      try {
        const pendingRoute = await BackgroundSmsListener.consumePendingOpenRoute();
        if (pendingRoute?.route === IMPORT_ROUTE) {
          if (BLOCK_STARTUP_IMPORT_ROUTE) {
            if (import.meta.env.MODE === 'development') {
              console.log('[ROUTE_GUARD] blocked native startup navigation to import route', {
                pathname: location.pathname,
              });
            }
            return;
          }
          navigate(IMPORT_ROUTE);
        }
      } catch (err) {
        if (import.meta.env.MODE === 'development') {
          console.warn('[SMS] Error consuming pending native route:', err);
        }
      }
    };

    let appStateListener: { remove: () => void } | null = null;
    void CapacitorApp.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        await syncNativeInboxAndRoute();
      }
    }).then((listenerHandle) => {
      appStateListener = listenerHandle;
    });

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

          await syncNativeInboxAndRoute();

          const notificationPromptedKey = 'xpensia_notif_permission_prompted';
          try {
            const notificationPermission = await LocalNotifications.checkPermissions();
            const shouldPromptNotificationPermission =
              Capacitor.getPlatform() === 'android'
              && notificationPermission.display !== 'granted'
              && safeStorage.getItem(notificationPromptedKey) !== 'true';

            if (shouldPromptNotificationPermission) {
              await LocalNotifications.requestPermissions();
              safeStorage.setItem(notificationPromptedKey, 'true');
            }
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.warn('[SMS] Unable to check/request notification permission:', err);
            }
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

              enqueueSms({ sender, body, source: 'listener' });

              const appState = await CapacitorApp.getState();
              if (!appState.isActive) {
                return;
              }

              if (import.meta.env.MODE === 'development') {
                // console.log('[NOTIFY] App active. Showing in-app transaction banner.');
              }
              toast({
                title: 'New SMS transaction detected',
                description: 'Review imported SMS transactions when you are ready.',
                action: (
                  <ToastAction altText="View detected SMS transactions" onClick={() => navigate('/import-transactions')}>
                    View
                  </ToastAction>
                ),
              });
            });
            if (import.meta.env.MODE === 'development') {
              // console.log('[SMS] Successfully added SMS listener');
            }
          } catch (err) {
            if (import.meta.env.MODE === 'development') {
              console.error('[SMS] Error adding SMS listener:', err);
            }
          }
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
      appStateListener?.remove();
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
      if (startupSmsFlowRanRef.current) {
        console.log('[SMS_FLOW] startup flow skipped (already ran this session)');
        return;
      }

      const startupImportDone = safeStorage.getItem(SMS_STARTUP_IMPORT_DONE_KEY) === '1';
      if (startupImportDone) {
        console.log('[SMS_FLOW] startup flow skipped (already done)');
        if (location.pathname === IMPORT_ROUTE) {
          navigateRef.current(HOME_ROUTE, { replace: true });
        }
        return;
      }

      startupSmsFlowRanRef.current = true;

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
        startupImportEnabled: SMS_STARTUP_IMPORT_ENABLED,
        smsSenderFirstFlowV2Enabled,
        rollbackToLegacyRoutingOnce,
      });

      if (isCancelled) return;

      if (!SMS_STARTUP_IMPORT_ENABLED && location.pathname === IMPORT_ROUTE) {
        safeStorage.setItem(SMS_STARTUP_IMPORT_DONE_KEY, '1');
        console.log('[SMS_IMPORT] startup import disabled -> replace(HOME_ROUTE)', {
          pathnameBefore: location.pathname,
          targetPathname: HOME_ROUTE,
        });
        navigateRef.current(HOME_ROUTE, { replace: true });
        return;
      }

      if (flowDecision.nextStep === 'route_sender_discovery' && flowDecision.route && location.pathname !== flowDecision.route) {
        if (BLOCK_STARTUP_IMPORT_ROUTE && (flowDecision.route as string) === IMPORT_ROUTE) {
          if (import.meta.env.MODE === 'development') {
            console.log('[ROUTE_GUARD] blocked startup sender-discovery navigation to import route', {
              pathname: location.pathname,
              permissionState,
              providerSelectionState,
            });
          }
          return;
        }

        if (import.meta.env.MODE === 'development') {
          console.log('[ROUTE_GUARD] forcing import because sender discovery is required', {
            pathname: location.pathname,
            target: flowDecision.route,
            permissionState,
            providerSelectionState,
          });
        }
        navigateRef.current(flowDecision.route);
        return;
      }

      if (flowDecision.shouldTriggerAutoImport) {
        SmsImportService.checkForNewMessages(navigateRef.current, {
          auto: true,
          usePermissionDate: true,
          sourcePathname: location.pathname,
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

      if (onboardingDone && isDefaultCurrencySelectionRequired()) {
        setShowSmsPrompt(false);
        return;
      }

      const justCompleted = safeStorage.getItem('xpensia_onb_just_completed') === 'true';
      if (!justCompleted) return;

      const isNative = Capacitor.isNativePlatform();
      const isAndroid = Capacitor.getPlatform() === 'android';
      const alreadyPrompted = safeStorage.getItem('sms_prompt_shown') === 'true';

      console.log('[App] SMS prompt check:', { justCompleted, isNative, isAndroid, alreadyPrompted });

      if (alreadyPrompted) {
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

      // Clear flag and show prompt immediately once currency gate has been satisfied.
      safeStorage.removeItem('xpensia_onb_just_completed');
      console.log('[App] Showing SMS permission prompt immediately');
      setShowSmsPrompt(true);
    };

    checkAndMaybeShowSmsPrompt();
  }, [location.pathname, onboardingDone]);

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
  const requiresDefaultCurrency = onboardingDone && isDefaultCurrencySelectionRequired();
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

  if (requiresDefaultCurrency && !location.pathname.startsWith('/onboarding') && location.pathname !== '/set-default-currency') {
    traceAppRoot('AppRoutes redirect branch selected: enforce /set-default-currency');
    return (
      <>
        <AppWrapper />
        <Navigate to="/set-default-currency" replace />
      </>
    );
  }

  if (!requiresDefaultCurrency && location.pathname === '/set-default-currency') {
    traceAppRoot('AppRoutes redirect branch selected: /set-default-currency -> /home');
    return (
      <>
        <AppWrapper />
        <Navigate to="/home" replace />
      </>
    );
  }

  if (onboardingDone && location.pathname.startsWith('/onboarding')) {
    traceAppRoot(`AppRoutes redirect branch selected: /onboarding* -> ${requiresDefaultCurrency ? '/set-default-currency' : '/home'}`);
    return (
      <>
        <AppWrapper />
        <Navigate to={requiresDefaultCurrency ? '/set-default-currency' : '/home'} replace />
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
          path="/set-default-currency"
          element={
            <OnboardingGuard>
              <SetDefaultCurrency />
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
