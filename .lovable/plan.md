

# Fix: ResizeObserver Error Triggering "Something went wrong" Toast

## Root Cause

The `ResizeObserver loop completed with undelivered notifications` is a harmless browser notification, not an actual error. Every modern browser fires it when a ResizeObserver callback causes layout changes that can't complete in one animation frame. It's triggered by UI components like Radix dialogs and Recharts.

The global error handler in `AppWithLoader.tsx` catches this as a real error and calls `handleError()` which shows a destructive red toast. While the code deduplicates repeated errors, it still shows the toast on the **first** occurrence.

## Change

**File: `src/AppWithLoader.tsx`** (inside `setupGlobalErrorHandlers`, the `window.addEventListener('error', ...)` block around line 103)

Add an early return after computing the signature when it equals `'resizeobserver_loop_notification'`:

```text
const signature = buildErrorSignature(event.message, source, event.lineno, event.colno, stack)

// --- ADD THIS ---
if (signature === 'resizeobserver_loop_notification') {
  event.preventDefault()
  return   // Harmless browser noise - do not show toast
}
// --- END ---

const shouldNotify = shouldNotifyForSignature(signature, globalErrorLastSeen)
```

This completely suppresses the ResizeObserver error from reaching `handleError()` and showing a toast, while still allowing all real errors through.

## Why this is safe

- `ResizeObserver loop completed` is explicitly listed as [non-actionable by the W3C spec](https://github.com/w3c/csswg-drafts/issues/5765)
- Chrome, Firefox, and Safari all fire it routinely
- No application logic depends on this error
- The signature detection already exists in `buildErrorSignature` -- we just need to act on it earlier

