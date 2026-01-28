# Analytics Events Documentation

This document lists all analytics events tracked in the Xpensia app.

## Architecture

The app uses a dual-logging architecture:

| Function | Destination | Use Case |
|----------|-------------|----------|
| `logAnalyticsEvent()` | Firebase + Google Sheets | Critical user actions |
| `logFirebaseOnlyEvent()` | Firebase only | High-frequency events (screen views) |
| `logSheetsOnlyEvent()` | Google Sheets only | Debugging data (errors, template matches) |

---

## Events by Category

### App Lifecycle

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `app_launch` | logAnalyticsEvent | — | App opened (native only) |
| `app_start` | logAnalyticsEvent | — | SMS import starts |
| `app_error` | logSheetsOnlyEvent | route, boundary, message, stack | Unhandled component error |

### Onboarding

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `onboarding_complete` | logAnalyticsEvent | platform, timestamp | User completed onboarding |

### Screen Views

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `view_home` | logFirebaseOnlyEvent | timestamp | Home page viewed |
| `view_transactions` | logFirebaseOnlyEvent | timestamp | Transactions page viewed |
| `view_budget` | logFirebaseOnlyEvent | timestamp | Budget hub viewed |
| `view_settings` | logFirebaseOnlyEvent | timestamp | Settings page viewed |
| `view_analytics` | logAnalyticsEvent | screen, timestamp | Analytics page viewed |

### Transactions

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `transaction_add` | logAnalyticsEvent | category, amount, currency, type | New transaction created |
| `edit_transaction` | logAnalyticsEvent | — + keywordBank | Transaction edited |
| `transaction_delete` | logAnalyticsEvent | transaction_id or transfer_id | Transaction deleted |

### Budgets

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `budget_create` | logAnalyticsEvent | scope, period, amount, currency | New budget created |
| `budget_edit` | logAnalyticsEvent | budget_id, scope, period, amount | Budget updated |

### Smart Paste / SMS

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `smart_paste_sms` | logAnalyticsEvent | — | Smart paste initiated |
| `smart_paste_save` | logAnalyticsEvent | — | Smart paste transaction saved |
| `sms_import_complete` | logAnalyticsEvent | — | Manual SMS import finished |
| `sms_auto_import_complete` | logAnalyticsEvent | — | Auto SMS import finished |
| `sms_permission_granted` | logAnalyticsEvent | — | SMS permission granted |
| `sms_permission_request_timed_out` | logAnalyticsEvent | — | Permission request timed out |
| `sms_permission_request_failed` | logAnalyticsEvent | — | Permission request failed |

### Settings & Preferences

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `settings_saved` | logAnalyticsEvent | — | Settings saved |
| `theme_change` | logFirebaseOnlyEvent | theme | Theme preference changed |
| `auto_import_enabled` | logAnalyticsEvent | platform | SMS auto-import enabled |
| `auto_import_disabled` | logAnalyticsEvent | platform | SMS auto-import disabled |
| `profile_updated` | logAnalyticsEvent | — | User profile updated |
| `photo_added` | logAnalyticsEvent | — | Profile photo added |

### Data Management

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `data_export` | logAnalyticsEvent | count, platform | Transactions exported |
| `data_import` | logAnalyticsEvent | imported_count, existing_count, format | Transactions imported |
| `clear_sample_data` | logAnalyticsEvent | success, error | Sample data cleared |
| `activate_beta` | logAnalyticsEvent | success, invalid_code | Beta code entered |

### Navigation

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `budget_menu_click` | logAnalyticsEvent | beta_active | Budget menu clicked |
| `import_menu_click` | logAnalyticsEvent | beta_active | Import menu clicked |

### Feedback

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `feedback_open` | logAnalyticsEvent | screen_name | Feedback modal opened |
| `feedback_send` | logAnalyticsEvent | screen_name, rating, has_* | Feedback submitted |

### OTA Updates

| Event | Function | Parameters | Description |
|-------|----------|------------|-------------|
| `ota_update_downloaded` | logAnalyticsEvent | version, bundle_id | OTA bundle downloaded |
| `ota_update_applied` | logAnalyticsEvent | version, bundle_id | OTA bundle activated |

---

## Implementation Notes

### Adding New Events

1. Import the appropriate function from `@/utils/firebase-analytics`
2. Call at the relevant code location with event name and parameters
3. Add to this documentation

### Event Naming Conventions

- Use snake_case: `event_name`
- Prefix with category when helpful: `sms_permission_granted`
- Use past tense for completed actions: `transaction_add`, `data_export`
- Use present tense for state views: `view_home`, `feedback_open`

### Parameter Guidelines

- Keep parameter count minimal (3-5 max)
- Use consistent parameter names across events
- Avoid PII (personally identifiable information)
- Use ISO timestamps when needed: `timestamp: Date.now()`
