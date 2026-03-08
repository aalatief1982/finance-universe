import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'

import { initializeCapacitor } from './lib/capacitor-init'
import AppWithLoader from './AppWithLoader'

import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { logAnalyticsEvent } from '@/utils/firebase-analytics'
import { Device } from '@capacitor/device'

type XpensiaWindow = Window & {
  __xpensiaHideInitialLoading?: () => void
}

;(async () => {
  try {
    await initializeCapacitor()
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('[Capacitor] Initialization error:', err)
    }
  }

  // [REMOVABLE-DEBUG-TOAST] Toast 1 & 2 — store timestamps for later reporting
  ;(window as any).__flickerTimestamps = (window as any).__flickerTimestamps || {};
  ;(window as any).__flickerTimestamps.reactRenderCall = performance.now(); // Toast 1

  const root = createRoot(document.getElementById('root')!)
  root.render(<AppWithLoader />)

  const hideInitialLoading = () => {
    ;(window as XpensiaWindow).__xpensiaHideInitialLoading?.()
    ;(window as any).__flickerTimestamps.htmlLoaderHideTriggered = performance.now(); // [REMOVABLE-DEBUG-TOAST] Toast 2
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
