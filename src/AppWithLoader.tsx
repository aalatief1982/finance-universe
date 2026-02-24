import React, { useEffect, useState } from 'react'
import App from './App'
import { AppLoader } from './components/AppLoader'
import { initializeXpensiaStorageDefaults } from './lib/smart-paste-engine/initializeXpensiaStorageDefaults'
import { runMigrations } from './utils/migration/runMigrations'
import { handleError } from './utils/error-utils'
import { getFriendlyMessage } from './utils/errorMapper'
import { ErrorSeverity, ErrorType } from './types/error'
import { backgroundVendorSyncService } from './services/BackgroundVendorSyncService'

const TRACE_PREFIX = '[TRACE][APP_ROOT]'
let traceCounter = 0
const traceAppRoot = (message: string, ...args: unknown[]) => {
  traceCounter += 1
  const now = performance.now().toFixed(2)
  console.log(`${TRACE_PREFIX}[${traceCounter}][${now}ms] ${message}`, ...args)
}

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
  let isHandlingError = false;

  console.error = (...args) => {
    originalConsoleError(...args);
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

const AppWithLoader: React.FC = () => {
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    traceAppRoot('AppWithLoader mounted')
    return () => traceAppRoot('AppWithLoader unmounted')
  }, [])

  useEffect(() => {
    traceAppRoot(`AppWithLoader initializing state changed: ${initializing}`)
  }, [initializing])

  useEffect(() => {
    const initialize = async () => {
      traceAppRoot('AppWithLoader initialize start')
      try {
        await initializeXpensiaStorageDefaults()
        traceAppRoot('initializeXpensiaStorageDefaults completed')
        runMigrations()
        traceAppRoot('runMigrations completed')
        setupGlobalErrorHandlers()
        traceAppRoot('setupGlobalErrorHandlers completed')
        backgroundVendorSyncService.initialize()
        traceAppRoot('backgroundVendorSyncService.initialize completed')
      } catch (err) {
        traceAppRoot('AppWithLoader initialize error', err)
        if (import.meta.env.MODE === 'development') {
          console.error('[Init] Initialization error:', err)
        }
        setupGlobalErrorHandlers()
        traceAppRoot('setupGlobalErrorHandlers completed (fallback)')
        backgroundVendorSyncService.initialize()
        traceAppRoot('backgroundVendorSyncService.initialize completed (fallback)')
      } finally {
        traceAppRoot('AppWithLoader initialize end')
        setInitializing(false)
      }
    }

    initialize()
  }, [])

  return (
    <AppLoader isInitializing={initializing}>
      <App />
    </AppLoader>
  )
}

export default AppWithLoader
