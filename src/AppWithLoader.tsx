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
const GLOBAL_ERROR_DEDUPE_WINDOW_MS = 10_000
const globalErrorLastSeen = new Map<string, number>()
const globalRejectionLastSeen = new Map<string, number>()

const getErrorMessage = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return String((value as { message?: unknown }).message ?? 'Unknown error')
  }
  return String(value ?? 'Unknown error')
}

const getErrorStack = (value: unknown): string | undefined => {
  if (value instanceof Error) {
    return value.stack
  }
  if (typeof value === 'object' && value !== null && 'stack' in value) {
    return String((value as { stack?: unknown }).stack ?? '') || undefined
  }
  return undefined
}

const buildErrorSignature = (
  message: string,
  source: string,
  lineno?: number,
  colno?: number,
  stack?: string
): string => {
  const normalizedMessage = message.trim().toLowerCase()
  if (normalizedMessage.includes('resizeobserver loop completed with undelivered notifications')) {
    return 'resizeobserver_loop_notification'
  }

  const stackKey = stack?.split('\n')[0] ?? ''
  return `${message}|${source}|${lineno ?? 0}|${colno ?? 0}|${stackKey}`
}

const shouldNotifyForSignature = (signature: string, dedupeMap: Map<string, number>): boolean => {
  const now = Date.now()
  const lastSeenAt = dedupeMap.get(signature) ?? 0
  const shouldNotify = now - lastSeenAt >= GLOBAL_ERROR_DEDUPE_WINDOW_MS
  if (shouldNotify) {
    dedupeMap.set(signature, now)
  }
  return shouldNotify
}
const traceAppRoot = (message: string, ...args: unknown[]) => {
  traceCounter += 1
  const now = performance.now().toFixed(2)
  console.log(`${TRACE_PREFIX}[${traceCounter}][${now}ms] ${message}`, ...args)
}

function setupGlobalErrorHandlers() {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = getErrorMessage(reason)
    const stack = getErrorStack(reason)
    const source = 'unhandledrejection'
    const signature = buildErrorSignature(message, source, undefined, undefined, stack)
    const shouldNotify = shouldNotifyForSignature(signature, globalRejectionLastSeen)

    if (shouldNotify) {
      console.error('[GLOBAL_ERROR]', {
        signature,
        message,
        source,
        stack,
      })
    }

    handleError({
      type: ErrorType.UNKNOWN,
      message: getFriendlyMessage(reason) || 'Unhandled Promise Rejection',
      severity: ErrorSeverity.ERROR,
      details: {
        source,
        signature,
        stack,
      },
      originalError: reason
    }, shouldNotify)
    event.preventDefault()
  })

  window.addEventListener('error', (event) => {
    const fallbackError = new Error(`${event.message} (${event.filename}:${event.lineno}:${event.colno})`)
    const originalError = event.error ?? fallbackError
    const stack = getErrorStack(originalError) ?? getErrorStack(fallbackError)
    const source = event.filename || 'window.onerror'
    const signature = buildErrorSignature(event.message, source, event.lineno, event.colno, stack)

    if (signature === 'resizeobserver_loop_notification') {
      event.preventDefault()
      return // Harmless browser noise — do not show toast
    }

    const shouldNotify = shouldNotifyForSignature(signature, globalErrorLastSeen)

    if (shouldNotify) {
      console.error('[GLOBAL_ERROR]', {
        signature,
        message: event.message,
        source,
        lineno: event.lineno,
        colno: event.colno,
        stack,
      })
    }

    handleError({
      type: ErrorType.UNKNOWN,
      message: getFriendlyMessage(originalError) || 'Uncaught Error',
      severity: ErrorSeverity.CRITICAL,
      details: {
        source: 'window.onerror',
        signature,
        location: {
          source,
          lineno: event.lineno,
          colno: event.colno,
        },
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack,
      },
      originalError,
    }, shouldNotify)
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
        if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #5] Init Complete\nTime: ${performance.now().toFixed(2)}ms`);
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
