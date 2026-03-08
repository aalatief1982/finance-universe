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
import EngineOutPage from './pages/EngineOutPage';
import TrainModel from '@/pages/TrainModel';
import BuildTemplate from '@/pages/BuildTemplate';
import ProcessSmsMessages from '@/pages/ProcessSmsMessages';
import SmsProviderSelection from '@/pages/SmsProviderSelection';
import CustomParsingRules from '@/pages/CustomParsingRules';
import ProcessVendors from '@/pages/sms/ProcessVendors';
import VendorCategorization from '@/pages/sms/VendorCategorization';
import VendorMapping from '@/pages/VendorMapping';
import ReviewSmsTransactions from '@/pages/ReviewSmsTransactions';
import SmsReviewInboxPage from '@/pages/SmsReviewInboxPage';
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
import { SplashScreen } from './components/SplashScreen';


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
  SMS_AUTO_IMPORT_ENABLED,
  consumeSmsSenderFirstFlowV2RollbackToggle,
  isSmsSenderFirstFlowV2Enabled,
} from '@/lib/env';
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
import { ShareTarget } from '@/plugins/ShareTargetPlugin';
import { readPendingSharedText, savePendingSharedText } from '@/lib/share-target/pendingSharedText';

const HOME_ROUTE = '/home';
const IMPORT_ROUTE = '/import-transactions';
const SHARE_DEDUPE_WINDOW_MS = 30_000;
const SMS_STARTUP_IMPORT_DONE_KEY = 'xpensia_sms_startup_import_done';

const TRACE_PREFIX = '[TRACE][APP_ROOT]';
const traceAppRoot = (message: string, ...args: unknown[]) => {
  const now = performance.now().toFixed(2);
  console.log(`${TRACE_PREFIX}[${now}ms] ${message}`, ...args);
};


const IMPORT_ROUTES = new Set([
  '/process-sms',
  '/sms-providers',
  '/sms/process-vendors',
  '/sms/vendors',
  '/vendor-mapping',
  '/review-sms-transactions',
]);

const NOTIFICATION_SOURCE_SMS = 'sms_notification';
const NOTIFICATION_TAP_SUPPRESS_TOAST_WINDOW_MS = 15000;
let suppressSmsToastUntil = 0;

const markNotificationTapFlow = (reason: string, source?: string) => {
  suppressSmsToastUntil = Date.now() + NOTIFICATION_TAP_SUPPRESS_TOAST_WINDOW_MS;
  console.log('[SMS_NOTIFICATION_FLOW] notification tap flow activated', {
    reason,
    source: source ?? null,
    suppressSmsToastUntil,
  });
};

const shouldSuppressSmsToast = () => Date.now() < suppressSmsToastUntil;

let hasLoggedImportDisabledWarning = false;

const ImportDisabledGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  if (!SMS_AUTO_IMPORT_ENABLED && IMPORT_ROUTES.has(location.pathname)) {
    if (!hasLoggedImportDisabledWarning) {
      console.warn('[SMS_IMPORT] import route access blocked while SMS auto-import is disabled', {
        blockedPath: location.pathname,
        redirectTo: HOME_ROUTE,
      });
      hasLoggedImportDisabledWarning = true;
    }

    return <Navigate to={HOME_ROUTE} replace />;
  }

  return <>{children}</>;
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
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const TRACE_PREFIX = '[SHARE_FLOW][APP]';
    const logShareFlow = (message: string, payload?: Record<string, unknown>) => {
      const ts = new Date().toISOString();
      if (payload) {
        console.log(`${TRACE_PREFIX}[${ts}] ${message}`, payload);
        return;
      }
      console.log(`${TRACE_PREFIX}[${ts}] ${message}`);
    };

    const recentlyHandledShareRef = { current: new Map<string, number>() };

    const buildShareSignature = (text: string, source?: string) => `${text}|${source ?? 'unknown'}`;

    const shouldHandleShare = (signature: string, intake: 'consumePendingSharedText' | 'sharedTextReceived') => {
      const now = Date.now();
      const dedupeMap = recentlyHandledShareRef.current;

      for (const [key, lastSeenAt] of dedupeMap.entries()) {
        if (now - lastSeenAt > SHARE_DEDUPE_WINDOW_MS) {
          dedupeMap.delete(key);
        }
      }

      const lastSeenAt = dedupeMap.get(signature) ?? 0;
      if (now - lastSeenAt <= SHARE_DEDUPE_WINDOW_MS) {
        logShareFlow('duplicate payload ignored by in-memory dedupe window', {
          intake,
          signature,
          dedupeWindowMs: SHARE_DEDUPE_WINDOW_MS,
          ageMs: now - lastSeenAt,
        });
        return false;
      }

      dedupeMap.set(signature, now);
      return true;
    };

    const persistAndRouteSharedText = (
      payload: { text?: string; source?: string; receivedAt?: number },
      intake: 'consumePendingSharedText' | 'sharedTextReceived',
    ) => {
      const normalizedText = payload.text?.trim();


      if (!normalizedText) {
        logShareFlow('ignored empty payload', {
          intake,
          source: payload.source ?? null,
          receivedAt: payload.receivedAt ?? null,
        });
        return;
      }

      const signature = buildShareSignature(normalizedText, payload.source);
      if (!shouldHandleShare(signature, intake)) {
        return;
      }

      const existingPending = readPendingSharedText();
      if (existingPending?.text === normalizedText && (existingPending?.source ?? 'unknown') === (payload.source ?? 'unknown')) {
        logShareFlow('duplicate payload ignored: same pending shared text already staged', {
          intake,
          signature,
          existingReceivedAt: existingPending?.receivedAt ?? null,
          incomingReceivedAt: payload.receivedAt ?? null,
        });
        return;
      }

      logShareFlow('payload received', {
        intake,
        source: payload.source ?? null,
        receivedAt: payload.receivedAt ?? null,
        textLength: normalizedText.length,
      });

      const stored = savePendingSharedText({
        text: normalizedText,
        source: payload.source,
        receivedAt: payload.receivedAt,
      });

      if (!stored) {
        logShareFlow('failed to persist payload', {
          intake,
          source: payload.source ?? null,
        });
        return;
      }

      const currentPath = window.location.pathname;
      const shouldNavigate = currentPath !== IMPORT_ROUTE;

      logShareFlow('payload persisted', {
        intake,
        shouldNavigate,
        currentPath,
        targetPath: IMPORT_ROUTE,
      });



      if (shouldNavigate) {
        setTimeout(() => navigateRef.current(IMPORT_ROUTE), 300);
      }
    };

    let shareListener: { remove: () => Promise<void> } | null = null;

    logShareFlow('share coordinator bootstrap start', {
      pathname: window.location.pathname,
    });

    void ShareTarget.consumePendingSharedText()
      .then((payload) => {
        persistAndRouteSharedText(payload, 'consumePendingSharedText');
      })
      .catch((err) => {
        console.warn('[SHARE_TARGET] Error consuming pending shared text', err);
      });

    void ShareTarget.addListener('sharedTextReceived', (payload) => {
      persistAndRouteSharedText(payload, 'sharedTextReceived');
    }).then((listener) => {
      shareListener = listener;
      logShareFlow('sharedTextReceived listener attached');
    }).catch((err) => {
      console.warn('[SHARE_TARGET] Error attaching share listener', err);
    });

    return () => {
      if (shareListener) {
        void shareListener.remove();
      }
    };
  }, []);

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
        console.log('[SMS_NOTIFICATION_FLOW] consumePendingOpenRoute result (resume/active)', {
          route: pendingRoute?.route ?? null,
          source: pendingRoute?.source ?? null,
          pathname: location.pathname,
        });
        if (pendingRoute?.route === IMPORT_ROUTE) {
          if (!SMS_AUTO_IMPORT_ENABLED) {
            console.log('[SMS_IMPORT] disabled -> skipping native pending import route', {
              pathname: location.pathname,
            });
            return;
          }

          if (pendingRoute?.source === NOTIFICATION_SOURCE_SMS) {
            markNotificationTapFlow('resume_pending_route', pendingRoute.source);
          }

          console.log('[SMS_NOTIFICATION_FLOW] routing to import route from pending route (resume/active)', {
            fromPath: location.pathname,
            targetPath: IMPORT_ROUTE,
            source: pendingRoute?.source ?? null,
          });
          navigateRef.current(IMPORT_ROUTE);
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
        // Re-check for shared text on resume (warm start from share sheet)
        try {
          const sharePayload = await ShareTarget.consumePendingSharedText();
          const hasText = Boolean(sharePayload?.text?.trim());
          const normalizedText = sharePayload?.text?.trim() ?? '';
          let stored = false;
          let willNavigate = false;
          
          if (hasText) {
            stored = savePendingSharedText({
              text: normalizedText,
              source: sharePayload.source,
              receivedAt: sharePayload.receivedAt,
            });
            willNavigate = stored && window.location.pathname !== IMPORT_ROUTE;
          }



          if (willNavigate) {
            console.log('[SHARE_FLOW][RESUME] navigating to Smart Entry from app resume');
            navigateRef.current(IMPORT_ROUTE);
            return; // Skip SMS flow — share takes priority
          }
        } catch (err) {
          console.warn('[SHARE_TARGET] Error consuming shared text on resume', err);
        }

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

              const suppressToast = shouldSuppressSmsToast();
              if (suppressToast) {
                console.log('[SMS_NOTIFICATION_FLOW] toast suppressed', {
                  reason: 'notification_tap_flow_active',
                  sender: sender ?? null,
                });
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
  }, [location.pathname, navigate]);

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
        return;
      }

      startupSmsFlowRanRef.current = true;

      // Share intent takes priority over startup SMS flow
      const pendingShare = readPendingSharedText();
      
      if (pendingShare?.text) {
        console.log('[SMS_FLOW] startup flow skipped: pending shared text takes priority');
        return;
      }

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
        startupImportEnabled: SMS_AUTO_IMPORT_ENABLED,
        smsSenderFirstFlowV2Enabled,
        rollbackToLegacyRoutingOnce,
      });

      if (isCancelled) return;

      if (flowDecision.nextStep === 'route_sender_discovery' && flowDecision.route && location.pathname !== flowDecision.route) {
        if (!SMS_AUTO_IMPORT_ENABLED && IMPORT_ROUTES.has(flowDecision.route as string)) {
          console.log('[SMS_IMPORT] disabled -> skipping startup sender-discovery navigation', {
            pathname: location.pathname,
            targetPathname: flowDecision.route,
          });
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
        if (!SMS_AUTO_IMPORT_ENABLED) {
          console.log('[SMS_IMPORT] disabled -> skipping startup auto import trigger');
          return;
        }

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
  }, [location.pathname, user]);



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
  const [initialRouteCheckDone, setInitialRouteCheckDone] = React.useState(Capacitor.getPlatform() === 'web');
  const [pendingLaunchRoute, setPendingLaunchRoute] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    let cancelled = false;
    const resolveInitialLaunchRoute = async () => {
      try {
        const pendingRoute = await BackgroundSmsListener.consumePendingOpenRoute();
        console.log('[SMS_NOTIFICATION_FLOW] consumePendingOpenRoute result (startup)', {
          route: pendingRoute?.route ?? null,
          source: pendingRoute?.source ?? null,
          pathname: location.pathname,
        });

        if (cancelled) {
          return;
        }

        if (pendingRoute?.route === IMPORT_ROUTE && SMS_AUTO_IMPORT_ENABLED) {
          if (pendingRoute?.source === NOTIFICATION_SOURCE_SMS) {
            markNotificationTapFlow('cold_start_pending_route', pendingRoute.source);
          }
          setPendingLaunchRoute(IMPORT_ROUTE);
          console.log('[SMS_NOTIFICATION_FLOW] startup route selected', {
            finalRoute: IMPORT_ROUTE,
            source: pendingRoute?.source ?? null,
          });
          return;
        }

        if (pendingRoute?.route === IMPORT_ROUTE && !SMS_AUTO_IMPORT_ENABLED) {
          console.log('[SMS_IMPORT] disabled -> skipping startup pending import route', {
            pathname: location.pathname,
            source: pendingRoute?.source ?? null,
          });
        }

        console.log('[SMS_NOTIFICATION_FLOW] startup route selected', {
          finalRoute: null,
          source: pendingRoute?.source ?? null,
        });
      } catch (error) {
        console.warn('[SMS_NOTIFICATION_FLOW] failed to resolve startup route', error);
      } finally {
        if (!cancelled) {
          setInitialRouteCheckDone(true);
        }
      }
    };

    void resolveInitialLaunchRoute();

    return () => {
      cancelled = true;
    };
  }, []);

  traceAppRoot(`AppRoutes render pathname=${location.pathname} onboardingDone=${onboardingDone}`);
  traceState('AppRoutes render flags', {
    onboardingDone,
    pathname: location.pathname,
  });


  React.useEffect(() => {
    if (!pendingLaunchRoute) {
      return;
    }

    if (location.pathname === pendingLaunchRoute) {
      console.log('[SMS_NOTIFICATION_FLOW] pending launch route reached', {
        pathname: location.pathname,
      });
    }
  }, [location.pathname, pendingLaunchRoute]);

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

  if (!initialRouteCheckDone) {
    traceAppRoot('AppRoutes waiting for startup route resolution');
    return <SplashScreen />;
  }

  if (pendingLaunchRoute && location.pathname !== pendingLaunchRoute) {
    traceAppRoot(`AppRoutes notification launch redirect -> ${pendingLaunchRoute}`);
    return (
      <>
        <AppWrapper />
        <Navigate to={pendingLaunchRoute} replace />
      </>
    );
  }

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
          path="/engine-out"
          element={
            <ErrorBoundary name="Engine Out Page">
              <EngineOutPage />
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
        <Route path="/process-sms" element={<ImportDisabledGuard><ProcessSmsMessages /></ImportDisabledGuard>} />
        <Route
          path="/sms-providers"
          element={
            <ImportDisabledGuard>
              <OnboardingGuard>
                <SmsProviderSelection />
              </OnboardingGuard>
            </ImportDisabledGuard>
          }
        />
        <Route path="/sms/process-vendors" element={<ImportDisabledGuard><ProcessVendors /></ImportDisabledGuard>} />
        <Route path="/sms/vendors" element={<ImportDisabledGuard><VendorCategorization /></ImportDisabledGuard>} />
        <Route path="/vendor-mapping" element={<ImportDisabledGuard><VendorMapping /></ImportDisabledGuard>} />
        <Route path="/review-sms-transactions" element={<ImportDisabledGuard><ReviewSmsTransactions /></ImportDisabledGuard>} />
        <Route path="/sms-review" element={<SmsReviewInboxPage />} />
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
