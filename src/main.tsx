import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'

import { initializeCapacitor } from './lib/capacitor-init'
import AppWithLoader from './AppWithLoader'

import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { logAnalyticsEvent } from '@/utils/firebase-analytics'
import { Device } from '@capacitor/device'

const DEBUG_STARTUP = new URLSearchParams(window.location.search).get('debugStartup') === '1';

type XpensiaWindow = Window & {
  __xpensiaHideInitialLoading?: () => void
}

;(async () => {
  if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #1] Boot Start\nTime: ${performance.now().toFixed(2)}ms`);
  try {
    await initializeCapacitor()
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Capacitor] Initialization error:', err)
    }
  }

  const root = createRoot(document.getElementById('root')!)
  root.render(<AppWithLoader />)
  if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #2] React Root Rendered\nTime: ${performance.now().toFixed(2)}ms`);

  const hideInitialLoading = () => {
    if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #3] HTML Loader Hide\nTime: ${performance.now().toFixed(2)}ms`);
    ;(window as XpensiaWindow).__xpensiaHideInitialLoading?.()
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(hideInitialLoading)
  } else {
    setTimeout(hideInitialLoading, 0)
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
