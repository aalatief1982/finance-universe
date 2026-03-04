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

  const root = createRoot(document.getElementById('root')!)
  root.render(<AppWithLoader />)

  // Safety fallback: if React SplashScreen never calls hideInitialLoading
  // (e.g. crash during mount), force-hide after 3s to avoid stuck loader.
  setTimeout(() => {
    ;(window as XpensiaWindow).__xpensiaHideInitialLoading?.()
  }, 3000)
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
