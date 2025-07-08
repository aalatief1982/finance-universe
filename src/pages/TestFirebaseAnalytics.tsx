import React from 'react'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { Button } from '@/components/ui/button' // Adjust if using a different UI lib

const TestFirebaseAnalytics: React.FC = () => {
  const sendDebugEvent = async () => {
    try {
      const eventName = 'debug_view_test'
      const params = {
        ts: `${Date.now()}`,
        context: 'test_analytics_screen',
      }

      console.log('[DEBUG] Sending Firebase logEvent:', { name: eventName, params })

      await FirebaseAnalytics.setUserId({ userId: 'debug_user_001' })

      await FirebaseAnalytics.setUserProperty({
        name: 'env',
        value: 'xpensia_debug',
      })

      await FirebaseAnalytics.logEvent({
        name: eventName,
        params,
      })

      alert('✅ Event sent to Firebase')
    } catch (err: any) {
      console.error('❌ Firebase logEvent failed:', err)
      alert('❌ Error: ' + (err?.message || 'Unknown error'))
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Firebase Analytics Debug</h1>
      <p className="text-sm text-gray-600">
        Click the button below to log a test event to Firebase.
      </p>
      <Button onClick={sendDebugEvent}>Log Test Event</Button>
    </div>
  )
}

export default TestFirebaseAnalytics
