/**
 * @file NotificationSettings.tsx
 * @description Settings section for NotificationSettings.
 *
 * @module components/settings/NotificationSettings
 *
 * @responsibilities
 * 1. Render settings controls and labels
 * 2. Persist setting changes via callbacks/services
 * 3. Provide validation or feedback where required
 *
 * @review-tags
 * - @ui: settings state wiring
 *
 * @review-checklist
 * - [ ] Settings state reflects stored preferences
 * - [ ] Changes are persisted or bubbled up
 */
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
