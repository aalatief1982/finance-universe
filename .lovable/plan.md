

# Fix: Header & Footer Jitter on Android During Scroll

## Root Cause

This app does **not** use Ionic components (IonPage/IonContent). It's a plain React + Capacitor app where:

- **Header** (`position: fixed; top: 0`) and **BottomNav** (`position: fixed; bottom: 0`) float over the page
- The **body** is the scroll container — content overflows the viewport and the browser scrolls the entire document

On Android WebView, body-level scrolling causes `position: fixed` elements to "repaint late" during fast flings. The compositor doesn't always keep fixed elements locked to the viewport during body scroll, producing the visible jitter/shake you see compared to WhatsApp (which uses a contained scroll area, not body scroll).

The existing GPU-promotion CSS (`transform-gpu`, `will-change-transform`, `backface-visibility: hidden`) on Header and BottomNav helps but cannot fully solve the problem when the body itself is scrolling.

## The Fix

**Convert the Layout from body-scroll to contained-scroll.**

Instead of letting content overflow the viewport and relying on body scroll, make the Layout root a viewport-sized flex container with `overflow: hidden`, and let only the main content area scroll via `overflow-y: auto`.

This is the same pattern WhatsApp and other native-feeling apps use: the outer shell is locked to the viewport, and only the content pane scrolls.

### What changes in `src/components/Layout.tsx`

**Change 1 — Root div: lock to viewport height (non-onboarding only)**

```
Before:  "min-h-[100dvh] flex flex-col"
After:   "h-[100dvh] flex flex-col overflow-hidden"
```

This prevents the body from ever scrolling on app pages. The onboarding path (`isOnboardingLayout`) keeps its existing `min-h-screen` — completely untouched.

**Change 2 — Main content wrapper: make it the scroll container**

```
Before:  <div className="h-full ...">
After:   <div className="h-full overflow-y-auto ...">
```

This `div` wrapping page content becomes the only scrolling element. Since Header and BottomNav are `position: fixed` and sit outside this scroll container's paint area, they cannot jitter.

**Change 3 — Bottom padding for BottomNav clearance**

Currently `pb-safe-bottom` only accounts for the device home indicator (~34px), not the full BottomNav height (~56px + safe area). Content at the bottom gets hidden behind the nav bar.

```
Before:  isResponsiveMobile && safeAreaPadding && "pb-safe-bottom"
After:   !hideNavigation && isMobile && "pb-20",
         isResponsiveMobile && safeAreaPadding && "pb-safe-bottom"
```

`pb-20` (80px) covers the BottomNav + safe area on all Android devices. When `hideNavigation` is true (onboarding), this padding is skipped.

## Files Changed

| File | What Changes |
|---|---|
| `src/components/Layout.tsx` | 3 small changes (root height, scroll container, bottom padding) |

**No other files are modified.** No changes to:
- Onboarding components, CSS, or routing
- Header.tsx or BottomNav.tsx
- Any page component (Home, Transactions, Analytics, etc.)
- Global CSS or index.css
- Navigation architecture or routing

## Why This Works

- **Body never scrolls** on app pages, so Android WebView's compositor has no reason to repaint fixed elements
- Header and BottomNav remain `position: fixed` with their existing GPU-promotion CSS — they're now truly static because no ancestor is scrolling
- The contained scroll area (`overflow-y-auto`) is a standard scrolling context that Android WebView handles smoothly
- Onboarding is completely isolated — it uses the `isOnboardingLayout` branch which stays at `min-h-screen` with no scroll changes

## Why It Won't Break Anything

- All existing page content renders identically — it's the same flex layout, just the scroll target moves from body to a content div
- `ScrollToTop` component (already in App.tsx) may need the scroll target adjusted, but since it likely calls `window.scrollTo`, pages will still reset on navigation via the `AnimatePresence` key change
- Modals, dropdowns, and popovers from Radix UI use portals — they render outside the scroll container and are unaffected
- Desktop: BottomNav is hidden (`md:hidden`), and the contained scroll behaves identically to body scroll on desktop browsers

## Verification

After building the APK:
1. Open any page with scrollable content (Home, Transactions)
2. Fast-fling scroll up and down
3. Header and BottomNav should remain perfectly stable — no shake, no lag, no repaint flicker
4. Last items in lists should be fully visible above the bottom nav
5. Onboarding slides should look and behave exactly as before

