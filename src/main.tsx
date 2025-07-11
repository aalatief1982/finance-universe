import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/app.css'

import { handleError } from './utils/error-utils'
import { ErrorType, ErrorSeverity } from './types/error'
import { initializeXpensiaStorageDefaults } from './lib/smart-paste-engine/initializeXpensiaStorageDefaults'
import { initializeCapacitor } from './lib/capacitor-init'
import { demoTransactionService } from './services/DemoTransactionService'

import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { Device } from '@capacitor/device'


function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    handleError({
      type: ErrorType.UNKNOWN,
      message: event.reason?.message || 'Unhandled Promise Rejection',
      severity: ErrorSeverity.ERROR,
      details: { source: 'unhandledrejection', stack: event.reason?.stack },
      originalError: event.reason
    })
    event.preventDefault()
  })

  window.addEventListener('error', (event) => {
    handleError({
      type: ErrorType.UNKNOWN,
      message: event.error?.message || event.message || 'Uncaught Error',
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

  const originalConsoleError = console.error
  console.error = (...args) => {
    originalConsoleError(...args)
    const errorText = args.join(' ')
    if (typeof errorText === 'string' && errorText.includes('React')) {
      handleError({
        type: ErrorType.UNKNOWN,
        message: 'React error',
        severity: ErrorSeverity.ERROR,
        details: { source: 'react_error', fullMessage: errorText }
      })
    }
  }
  console.info('Global error handlers initialized')
}

// Init
try {
  initializeCapacitor()
} catch (err) {
  console.error('[Capacitor] Initialization error:', err)
}

initializeXpensiaStorageDefaults()
demoTransactionService.seedDemoTransactions()
setupGlobalErrorHandlers()

const root = createRoot(document.getElementById("root")!)
root.render(<App />)

if (Capacitor.isNativePlatform()) {
  ;(async () => {
    try {
      await FirebaseAnalytics.enable()
      const { identifier } = await Device.getId()
      await FirebaseAnalytics.setUserId({ userId: identifier })
      await FirebaseAnalytics.logEvent({ name: 'app_launch' })
    } catch (err) {
      console.warn('[FirebaseAnalytics] error:', err)
    }
  })()
}
