import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/app.css'

import { handleError } from './utils/error-utils'
import { getFriendlyMessage } from './utils/errorMapper'
import { ErrorType, ErrorSeverity } from './types/error'
import { initializeXpensiaStorageDefaults } from './lib/smart-paste-engine/initializeXpensiaStorageDefaults'
import { initializeCapacitor } from './lib/capacitor-init'
import { demoTransactionService } from './services/DemoTransactionService'

import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { logAnalyticsEvent } from '@/utils/firebase-analytics'
import { Device } from '@capacitor/device'


function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    handleError({
      type: ErrorType.UNKNOWN,
      message: getFriendlyMessage(event.reason) || 'Unhandled Promise Rejection',
      severity: ErrorSeverity.ERROR,
      details: { source: 'unhandledrejection', stack: event.reason?.stack },
      originalError: event.reason
    })
    event.preventDefault()
  })

  window.addEventListener('error', (event) => {
    handleError({
      type: ErrorType.UNKNOWN,
      message: getFriendlyMessage(event.error) || 'Uncaught Error',
      severity: ErrorSeverity.CRITICAL,
      details: {
        source: 'window.onerror',
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack
      },
      originalError: event.error
    })
    event.preventDefault()
  })

  const originalConsoleError = console.error;
  let isHandlingError = false; // Prevent infinite recursion
  
  console.error = (...args) => {
    originalConsoleError(...args);
    
    // Prevent recursive calls
    if (isHandlingError) return;
    
    const errorText = args.join(' ');
    if (typeof errorText === 'string' && errorText.includes('React')) {
      isHandlingError = true;
      try {
        handleError({
          type: ErrorType.UNKNOWN,
          message: 'React error',
          severity: ErrorSeverity.ERROR,
          details: { source: 'react_error', fullMessage: errorText }
        });
      } finally {
        isHandlingError = false;
      }
    }
  };
  console.info('Global error handlers initialized')
}

// Init
try {
  initializeCapacitor()
} catch (err) {
  if (import.meta.env.MODE === 'development') {
    console.error('[Capacitor] Initialization error:', err)
  }
}

;(async () => {
  try {
    await initializeXpensiaStorageDefaults()
    demoTransactionService.seedDemoTransactions()
    setupGlobalErrorHandlers()

    const root = createRoot(document.getElementById("root")!)
    root.render(<App />)
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Init] Initialization error:', err)
    }
    // Fallback initialization without vendor sync
    demoTransactionService.seedDemoTransactions()
    setupGlobalErrorHandlers()
    const root = createRoot(document.getElementById("root")!)
    root.render(<App />)
  }
})()

if (Capacitor.isNativePlatform()) {
  ;(async () => {
    try {
      await FirebaseAnalytics.enable()
      const { identifier } = await Device.getId()
      await FirebaseAnalytics.setUserId({ userId: identifier })
      await logAnalyticsEvent('app_launch')
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[FirebaseAnalytics] error:', err)
      }
    }
  })()
}
