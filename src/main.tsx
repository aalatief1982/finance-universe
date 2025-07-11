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
import { Filesystem, Directory } from '@capacitor/filesystem'

// For cordova-plugin-zip
declare global {
  interface Window {
    zip?: any
  }
}

const MANIFEST_URL = 'https://xpensia-505ac.web.app/manifest.json'
const ZIP_URL = 'https://xpensia-505ac.web.app/www.zip'
const LOCAL_VERSION_KEY = 'app_version'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function injectSpinnerCSS() {
  if (document.getElementById('xpensia-spinner-style')) return
  const style = document.createElement('style')
  style.id = 'xpensia-spinner-style'
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

function showUpdateSpinner() {
  injectSpinnerCSS()
  const spinnerOverlay = document.createElement('div')
  spinnerOverlay.id = 'xpensia-update-spinner'
  spinnerOverlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <img src="/assets/app-icon.png" alt="Updating..." style="
        width: 100px;
        height: 100px;
        border-radius: 50%;
        animation: spin 1.2s linear infinite;
        filter: drop-shadow(0 0 5px #00ffff);
      " />
    </div>
  `
  document.body.appendChild(spinnerOverlay)
}

function removeUpdateSpinner() {
  const el = document.getElementById('xpensia-update-spinner')
  if (el) el.remove()
}

async function checkAndUpdateIfNeeded() {
  try {
    const localManifest = await fetch('/manifest.json').then(res => res.json())
    const currentVersion = localStorage.getItem(LOCAL_VERSION_KEY) || localManifest.version

    const remoteManifest = await fetch(MANIFEST_URL).then(res => res.json())
    if (compareVersions(remoteManifest.version, currentVersion) <= 0) {
      console.log('No update needed')
      return
    }

    console.log(`Update available: ${remoteManifest.version}`)
    showUpdateSpinner()

    const zipBlob = await fetch(ZIP_URL).then(res => res.blob())
    const base64 = await blobToBase64(zipBlob)

    await Filesystem.writeFile({
      path: 'update.zip',
      directory: Directory.Cache,
      data: base64,
    })

    if (!window.zip?.unzip) throw new Error('cordova-plugin-zip is not available')

    await new Promise((resolve, reject) => {
      window.zip.unzip(
        'cache/update.zip',
        'document/www',
        (status: number) => {
          if (status === 0) reject(new Error('Unzip failed'))
          else resolve(true)
        },
        (progress: any) => console.log('Unzipping progress', progress)
      )
    })

    localStorage.setItem(LOCAL_VERSION_KEY, remoteManifest.version)
    alert(`Xpensia Updated!!\nYou are now on version ${remoteManifest.version}`)
    window.location.reload()
  } catch (err) {
    console.warn('Update check failed:', err)
  } finally {
    removeUpdateSpinner()
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1
  }
  return 0
}

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
  document.addEventListener('deviceready', () => {
    checkAndUpdateIfNeeded()
  })

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
