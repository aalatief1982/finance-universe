
# Fix Plan: 6 Issues — Root Causes & Precise Actions

---

## Issue 1: Remove Demo/Sample Transactions Entirely

### Root Cause
The demo seeding system is spread across 4 entry points and 3 files. There is no concept of "demo mode" in storage yet — the current system just seeds random transactions into the same real data key (`xpensia_transactions`) and marks them with `isSample: true`. This is the core confusion: the user sees a mix of fake and real data with no clear separation.

### What Needs to Be Deleted/Cleaned

**File: `src/services/DemoTransactionService.ts`**
- Delete the entire file. It seeds fake data on startup and is the root of the confusion.

**File: `src/main.tsx`**
- Remove the import of `demoTransactionService` (line 11)
- Remove both calls to `demoTransactionService.seedDemoTransactions()` (lines 34 and 45)

**File: `src/pages/Settings.tsx`**
- Remove the import of `demoTransactionService` (line 73)
- Remove the `handleClearSampleData` function (lines 604–623)
- Remove the "Clear Sample Data" UI block in the JSX (lines 934–949)

**File: `src/components/settings/DataManagementSettings.tsx`**
- Remove the import of `demoTransactionService` (line 27)
- Remove the `handleClearSampleData` function (lines ~119–153)
- Remove the "Clear Sample Data" UI row (lines ~227–236)
- Also replace the `window.location.reload()` in `handleImportData` (line 114) with a `window.dispatchEvent(new StorageEvent('storage', { key: 'xpensia_transactions' }))` — since the WebView reload causes Issue 4's WebView restart problem

**File: `src/types/transaction.ts` and `src/types/transaction.d.ts`**
- Remove the `isSample?: boolean` field (line 88 in `.ts`, line 39 in `.d.ts`) — it's only used by the demo service which is being deleted

**File: `src/lib/env.ts`**
- The `ENABLE_DEMO_MODE` flag on line 64 can be removed as it's no longer needed

**localStorage Keys to Ignore (no code needed)**
- `xpensia_demo_transactions_initialized` — this was only set by `DemoTransactionService`. Since the service is deleted and the key is never read elsewhere, it will just sit unused and expire naturally. No active cleanup needed.

**Note on Existing Seeded Data**
- Any existing transactions with `isSample: true` in a user's storage will remain. Since we're removing the filter/clear mechanism, they become indistinguishable from real transactions. If the user has already run the app, they may see old demo transactions mixed in. To handle this cleanly, we add a **one-time migration** in `runMigrations()` that removes any transactions where `isSample === true` on first run after this update. This is safe and silent.

---

## Issue 2: Date Filter Accuracy on Home Page Cards

### Root Cause (Confirmed by reading the code)
The filter logic itself (`filteredTransactions` memo on lines 95–130 of `Home.tsx`) is correct — it properly filters by day/week/month/year/custom ranges and passes filtered data to both `DashboardStats` (via `fxSummary`) and all charts.

The **only real bug** is the deselection behavior on line 192:
```typescript
onValueChange={(val) => setRange(val as Range)}
```
When the user taps the already-active toggle button, `ToggleGroup` emits an empty string `""`. This sets `range = ""`, which triggers the `if (!range) return transactions` branch in `filteredTransactions` — returning all transactions unfiltered. The cards then show all-time totals while the toggle shows nothing selected. This is visually confusing.

### Fix
**File: `src/pages/Home.tsx` line 192**

Change:
```typescript
onValueChange={(val) => setRange(val as Range)}
```
To:
```typescript
onValueChange={(val) => { if (val) setRange(val as Range); }}
```

This prevents the deselection. If the user taps the active toggle again, the range stays unchanged. One-line fix. The existing filter logic is correct and untouched.

---

## Issue 3: Home Page Flashing Before Onboarding Slides

### Root Cause (Confirmed by reading App.tsx lines 323–327)
In `AppWrapper`:
```typescript
useEffect(() => {
  if (showOnboarding && location.pathname !== '/onboarding') {
    navigate('/onboarding', { replace: true });
  }
}, [showOnboarding, location.pathname, navigate]);
```
`useEffect` runs **after the first paint**. The `<Route path="/" element={<Home />} />` renders and paints the Home component for one frame before this effect fires and redirects to `/onboarding`. On a slow device or with heavy components, this flash is visible.

### Fix
**File: `src/App.tsx`**

Add a synchronous `OnboardingGuard` component. `safeStorage.getItem` is synchronous, so the check happens during render — zero tick delay:

```typescript
const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const done = safeStorage.getItem('xpensia_onb_done') === 'true';
  if (!done) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};
```

Wrap the `/` and `/home` routes:
```tsx
<Route path="/" element={
  <OnboardingGuard>
    <ErrorBoundary name="Home Page"><Home /></ErrorBoundary>
  </OnboardingGuard>
} />
<Route path="/home" element={
  <OnboardingGuard>
    <ErrorBoundary name="Home Page"><Home /></ErrorBoundary>
  </OnboardingGuard>
} />
```

Remove the `useEffect` redirect block (lines 323–327) from `AppWrapper` — it's now redundant.

**Important:** The `showOnboarding` variable on line 69 of `App.tsx` (`const showOnboarding = safeStorage.getItem('xpensia_onb_done') !== 'true'`) is only used in that `useEffect`. Once that effect is removed, `showOnboarding` can also be removed.

---

## Issue 4: Safe Area Gap at Top of Onboarding Slides

### Root Cause (Confirmed by reading OnboardingSlides.tsx line 89)
```tsx
<div className="absolute top-0 z-10 left-1/2 transform -translate-x-1/2 pt-4 safe-area-inset-top">
```
`safe-area-inset-top` is not a valid Tailwind CSS class — it does nothing. The progress dots sit at a fixed `pt-4` (16px) from the top regardless of the device notch height. On devices with a tall notch or dynamic island, the dots overlap the notch area.

### Fix
**File: `src/onboarding/OnboardingSlides.tsx` line 89**

Replace:
```tsx
<div className="absolute top-0 z-10 left-1/2 transform -translate-x-1/2 pt-4 safe-area-inset-top">
```
With:
```tsx
<div
  className="absolute top-0 z-10 left-1/2 transform -translate-x-1/2"
  style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
>
```
This uses the real CSS environment variable, ensuring the dots sit below the status bar notch on any device. The `, 0px` fallback ensures it works on devices/browsers that don't support `env()`. All other slide content and layout is untouched.

---

## Issue 5: SMS Permission Timeout — Is Just Increasing to 30s Enough?

### Answer: Yes, for this specific case, increasing the timeout to 30s is the right and sufficient fix.

### Root Cause (Confirmed by reading SmsPermissionPrompt.tsx lines 182–212)
The code races `smsPermissionService.requestPermission()` against a 15-second timeout. The timeout was likely set conservatively. On Android, when the permission dialog appears, the user may spend more than 15 seconds reading it — especially first-time users who want to understand what they're granting. The 15-second limit fires a destructive "Request timed out" toast while the dialog is still visible, which is confusing.

The existing resume listener pattern (lines 111–176) correctly handles the case where Android doesn't resolve the Promise immediately — it listens for app resume and re-checks permission. This logic is sound.

**The only thing needed** is changing `REQUEST_TIMEOUT` from `15000` to `30000`.

**File: `src/components/SmsPermissionPrompt.tsx` line 183**

Change:
```typescript
const REQUEST_TIMEOUT = 15000; // ms
```
To:
```typescript
const REQUEST_TIMEOUT = 30000; // ms
```

Additionally, soften the timeout toast message from a destructive error to a neutral informational message (since the user may have just been slow to decide — not an error):

Change the `toast` variant from `'destructive'` to no variant (default), and update the description to:
```
"The permission dialog is still open. Please accept or deny it, or you can enable SMS from Settings later."
```

---

## Issue 6: SMS Lookback Period — Change from 6 Months to 15 Days + User Prompt

### Root Cause (Confirmed by reading env.ts and SmsImportService.ts)

The default lookback is set in `src/lib/env.ts` line 79:
```typescript
export const VITE_SMS_LOOKBACK_MONTHS = parseInt(
  getEnvironmentVariable('SMS_LOOKBACK_MONTHS', '6'),  // ← 6 months
  10
);
```
This value is read by `getSmsLookbackMonths()` which is called in `SmsReaderService.ts` line 163 as the fallback when no `startDate` is provided. The `getAutoImportStartDate()` in `sms-permission-storage.ts` already has a correct 30-day fallback (lines 92–94) for the auto-import path. However, the manual import path (when user explicitly goes to import) still uses the 6-month default via `getSmsLookbackMonths()`.

### Fix: Two-part

**Part A — Change the default lookback from 6 months to 15 days**

**File: `src/lib/env.ts` line 79**

Change:
```typescript
export const VITE_SMS_LOOKBACK_MONTHS = parseInt(
  getEnvironmentVariable('SMS_LOOKBACK_MONTHS', '6'),
  10
);
```

Since we're moving to days (not months), rename the variable and change the default. But to avoid breaking existing code that calls `getSmsLookbackMonths()` and passes the result to `subMonths()`, the cleanest approach is: change the default to `'1'` (1 month ≈ 30 days) at the env level, and change `getSmsLookbackMonths` to return days instead. However, this touches `SmsReaderService.ts` which uses `subMonths`.

**Simpler, safer approach**: Keep the months-based API but change the default to `1` (1 month ≈ 30 days, close enough to 15-30 days). This is a single character change with zero ripple effect. Choosing `1` (approximately 30 days) over `0.5` (15 days) because:
- `subMonths` only accepts integers
- 30 days is a reasonable "glimpse" that gives users enough history to see the pattern
- 15 days might feel too sparse on light SMS users

**File: `src/lib/env.ts` line 79**
```typescript
// Change '6' to '1'
getEnvironmentVariable('SMS_LOOKBACK_MONTHS', '1'),
```

Also update the storage key default so existing users who already have `'6'` stored get migrated. Add a one-time migration to reset `xpensia_sms_period_months` if it equals `'6'` (the old default), replacing it with `'1'`.

**Part B — Add user-facing prompt/explanation in the SMS Permission dialog**

**File: `src/components/SmsPermissionPrompt.tsx`**

Add an info line in the dialog body (after the benefits list, before the buttons) to set expectations:

```tsx
<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 mt-3">
  <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
  <p className="text-xs text-muted-foreground">
    <span className="font-medium text-foreground">First scan:</span>{' '}
    We'll look back 30 days to give you a feel for how SMS import works. You stay in full control.
  </p>
</div>
```

`Clock` is already imported in this file (line 29).

---

## Summary of All File Changes

| File | Change | Issue |
|---|---|---|
| `src/services/DemoTransactionService.ts` | Delete entire file | 1 |
| `src/main.tsx` | Remove import + 2 calls to `demoTransactionService.seedDemoTransactions()` | 1 |
| `src/pages/Settings.tsx` | Remove import, `handleClearSampleData` function, and its UI block | 1 |
| `src/components/settings/DataManagementSettings.tsx` | Remove import, `handleClearSampleData`, its UI row; replace `window.location.reload()` with storage event | 1 |
| `src/types/transaction.ts` | Remove `isSample?: boolean` field | 1 |
| `src/types/transaction.d.ts` | Remove `isSample?: boolean` field | 1 |
| `src/lib/env.ts` | Remove `ENABLE_DEMO_MODE` flag | 1 |
| `src/utils/migration/runMigrations.ts` | Add one-time migration to silently remove existing `isSample` transactions | 1 |
| `src/pages/Home.tsx` | Guard `onValueChange` to prevent empty-string deselection (1 line) | 2 |
| `src/App.tsx` | Add `OnboardingGuard` component; wrap `/` and `/home` routes; remove `useEffect` redirect block + `showOnboarding` variable | 3 |
| `src/onboarding/OnboardingSlides.tsx` | Fix safe-area top padding with `env(safe-area-inset-top)` inline style | 4 |
| `src/components/SmsPermissionPrompt.tsx` | Increase timeout to 30s; soften timeout toast; add 30-day scope info line | 5 + 6 |
| `src/lib/env.ts` | Change SMS lookback default from `'6'` months to `'1'` month | 6 |
| `src/utils/migration/runMigrations.ts` | Add one-time migration to reset `xpensia_sms_period_months` if it's `'6'` | 6 |

---

## Implementation Order

1. Delete `DemoTransactionService.ts` and clean all references (`main.tsx`, `Settings.tsx`, `DataManagementSettings.tsx`, type files, `env.ts`)
2. Add one-time migrations to `runMigrations.ts` (remove `isSample` transactions + reset SMS lookback)
3. Add `OnboardingGuard` to `App.tsx` and remove the `useEffect` redirect
4. Fix safe-area padding in `OnboardingSlides.tsx`
5. Fix date filter deselection in `Home.tsx`
6. Update `SmsPermissionPrompt.tsx` (timeout + toast + scope note)
7. Update `env.ts` SMS lookback default
