import React, { useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"

const NotificationSettings = () => {
  const [checked, setChecked] = useState(false)

  return (
    <div>
      <div className="space-y-2">
        <h4 className="leading-none font-medium">
          Push Notifications
        </h4>
        <p className="text-sm text-muted-foreground">
          Send push notifications to your device when new expenses are recorded.
        </p>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={(checked) => setChecked(checked)}
        className="mt-2"
      />
    </div>
  )
}

export default NotificationSettings
