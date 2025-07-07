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
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { Device } from '@capacitor/device'

declare const cordova: any

// Global initialization
try {
  initializeCapacitor()
} catch (err) {
  console.error('[Capacitor] Initialization error:', err)
}

initializeXpensiaStorageDefaults()
demoTransactionService.seedDemoTransactions()

if (Capacitor.isNativePlatform()) {
  FirebaseAnalytics.enable()
    .then(async () => {
      console.log('[FirebaseAnalytics] enabled')
      const deviceInfo = await Device.getId()
      const uuid = deviceInfo.identifier
      await FirebaseAnalytics.setUserId({ userId: uuid })
      await FirebaseAnalytics.logEvent({ name: 'app_launch' })
    })
    .catch(err => console.warn('[FirebaseAnalytics] failed', err))
}

// Global error handlers
const setupGlobalErrorHandlers = () => {
  window.addEventListener('unhandledrejection', (event) => {
    handleError({
      type: ErrorType.UNKNOWN,
      message: event.reason?.message || 'Unhandled Promise Rejection',
      severity: ErrorSeverity.ERROR,
      details: {
        source: 'unhandledrejection',
        stack: event.reason?.stack,
      },
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
    if (
      typeof errorText === 'string' &&
      (errorText.includes('React will try to recreate this component tree') ||
        errorText.includes('The above error occurred in the') ||
        errorText.includes('Error: Uncaught'))
    ) {
      const errorMatch = errorText.match(/Error: (.*?)(\\n|$)/)
      const errorMessage = errorMatch ? errorMatch[1] : 'React rendering error'

      handleError({
        type: ErrorType.UNKNOWN,
        message: errorMessage,
        severity: ErrorSeverity.ERROR,
        details: { source: 'react_error', fullMessage: errorText }
      })
    }
  }

  console.info('Global error handlers initialized')
}
setupGlobalErrorHandlers()

// OTA update logic (Capgo + Native)
async function checkForUpdates() {
  const currentAppVersion = '2.0.0' // Hardcoded or use native version API

  const pendingVersion = localStorage.getItem('pending_update')
  if (pendingVersion) {
    alert("Xpensia Updated! You're now on version " + pendingVersion)
    localStorage.setItem('app_version', pendingVersion)
    localStorage.removeItem('pending_update')
  }

  try {
    const res = await fetch('https://xpensia-505ac.web.app/manifest.json')
    const manifest = await res.json()
    const latestVersion = manifest.version
    const minimumRequired = manifest.minimumVersion || '0.0.0'
    const currentWebVersion = localStorage.getItem('app_version')

    // Step 1 – Force update via app store if native app is too old
    if (compareVersions(currentAppVersion, minimumRequired) < 0) {
      if (process.env.NODE_ENV === 'development') console.warn('🔴 Native version outdated — store update required')
      if (cordova?.plugins?.nativeAppUpdate) {
        cordova.plugins.nativeAppUpdate.checkAppUpdate(
          () => {
            if (process.env.NODE_ENV === 'development') console.log('🟢 Native app up-to-date')
          },
          (updateUrl: string) => {
            alert('A new version of Xpensia is required.\nRedirecting to store...')
            window.open(updateUrl, '_system', 'location=yes')
          },
          { url: 'https://xpensia-505ac.web.app/update.xml' }
        )
      }
      return
    }

    // Step 2 – Hot update (Capgo)
    if (!currentWebVersion) {
      localStorage.setItem('app_version', latestVersion)
      await CapacitorUpdater.notifyAppReady()
      return
    }

    if (latestVersion !== currentWebVersion) {
      if (process.env.NODE_ENV === 'development') console.log(`⬇️ Downloading hot update ${latestVersion}...`)
      const downloaded = await CapacitorUpdater.download({
        version: latestVersion,
        url: manifest.url || 'https://xpensia-505ac.web.app/www.zip'
      })
      localStorage.setItem('pending_update', latestVersion)
      localStorage.setItem('app_version', latestVersion)
      await CapacitorUpdater.set(downloaded) // reloads automatically
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Web bundle up-to-date')
      await CapacitorUpdater.notifyAppReady()
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.warn('⚠️ OTA update failed:', err)
    await CapacitorUpdater.notifyAppReady()
  }
}

// Compare 3-part version strings
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1
  }
  return 0
}

// Launch app and update check
try {
  const root = createRoot(document.getElementById("root")!)
  root.render(<App />)

  if (Capacitor.isNativePlatform()) {
    // Ensure deviceready fires
    if ((window as any).cordova && document.readyState === 'complete') {
      document.dispatchEvent(new Event('deviceready'))
    }

    document.addEventListener('deviceready', () => {
      checkForUpdates()
    })
  }
} catch (error) {
  handleError({
    type: ErrorType.UNKNOWN,
    message: 'Failed to initialize application',
    severity: ErrorSeverity.CRITICAL,
    details: { stage: 'initialization' },
    originalError: error
  })

  const rootElement = document.getElementById("root")
  const errorContainer = document.createElement('div')
  errorContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'Lato-Black', sans-serif; color: #666;">
      <h1 style="margin-bottom: 1rem;">Unable to Load Application</h1>
      <p>We're sorry, but the application couldn't be loaded. Please try refreshing the page.</p>
      <button 
        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
        onclick="window.location.reload()"
      >
        Refresh
      </button>
    </div>
  `
  if (rootElement && rootElement.parentNode) {
    rootElement.parentNode.replaceChild(errorContainer, rootElement)
  } else {
    document.body.appendChild(errorContainer)
  }
}
