

## Analysis: Why Android Share Sheet Doesn't Navigate to Smart Entry

### Root Cause

The share flow code is architecturally correct but has a **race condition on cold start**. Here's what happens:

1. User shares text → Android `MainActivity.handleShareIntent()` stores text in SharedPreferences
2. App boots → Capacitor bridge loads → JS `useEffect` runs `consumePendingSharedText()`
3. Text is retrieved, saved to localStorage, and `navigateRef.current('/import-transactions')` is called
4. **But**: The startup SMS flow (another `useEffect` with `[]` deps at ~line 690) runs concurrently and may navigate the user to a different route or the initial React Router render to `/home` wins because it happens synchronously before the async `consumePendingSharedText` resolves

Additionally, on **warm start** (app backgrounded, not killed):
- `onNewIntent` → `handleShareIntent` → `setPendingSharedText` → `notifyListeners("sharedTextReceived")`
- The JS listener should handle this, but there's no `appStateChange` re-check for pending shared text — only the initial `consumePendingSharedText` call runs once on mount

### Fix Plan

#### 1. Re-check pending shared text on app resume (`src/App.tsx`)

Add shared text consumption to the existing `appStateChange` listener (around line 550). When the app resumes (warm start from share sheet), re-call `consumePendingSharedText` and route if text is found:

```typescript
// Inside the appStateChange handler (line 550-553)
CapacitorApp.addListener('appStateChange', async (state) => {
  if (state.isActive) {
    // Re-check for shared text on resume (warm start share)
    try {
      const sharePayload = await ShareTarget.consumePendingSharedText();
      if (sharePayload?.text?.trim()) {
        persistAndRouteSharedText(sharePayload, 'consumePendingSharedText');
      }
    } catch {}
    await syncNativeInboxAndRoute();
  }
});
```

This requires restructuring slightly: the `persistAndRouteSharedText` function (currently scoped inside the share `useEffect`) needs to be accessible from the SMS `useEffect`, or the resume check needs to be added to the share `useEffect`'s own `appStateChange` listener.

#### 2. Add a small delay before share navigation on cold start (`src/App.tsx`)

In `persistAndRouteSharedText`, add a brief delay (~300ms) before navigating to ensure React Router has fully mounted:

```typescript
if (shouldNavigate) {
  setTimeout(() => navigateRef.current(IMPORT_ROUTE), 300);
}
```

#### 3. Ensure share navigation isn't overridden by startup SMS flow (`src/App.tsx`)

In the startup SMS flow (~line 690+), check if there's pending shared text and skip startup navigation if so:

```typescript
// Before the startup SMS flow decides to navigate
const pendingShare = readPendingSharedText();
if (pendingShare?.text) {
  console.log('[SMS_FLOW] startup flow skipped: pending shared text takes priority');
  return;
}
```

### Files to Change
- `src/App.tsx` — add resume re-check for shared text, add delayed navigation on cold start, add share-text priority check in startup SMS flow

