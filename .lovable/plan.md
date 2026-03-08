

## Root Cause Analysis

From the debug toast timeline (sorted chronologically):

| Time (ms) | Event |
|-----------|-------|
| 295 | React render called |
| 297 | HTML loader hidden |
| 305 | SplashScreen mounted |
| 307 | AppLoader mounted (initializing=true) |
| 311 | Init done (initializing=false) |
| 1312 | Splash hiding (1000ms timer fires) |
| 1340 | AppWrapper mounted at path=/ |
| 1342 | Route decided: path=/, onbDone=false |
| 1404 | Route decided: path=/onboarding, onbDone=false |
| 1404 | Onboarding + OnboardingSlides mounted |
| 1417 | Slide 1 image loaded |

### The Flicker Source

The flicker happens in the **105ms gap between t=1312 and t=1417**. Here's what occurs:

1. **t=1312**: React SplashScreen hides → `AppRoutes` renders for the first time
2. **t=1340-1342**: First render lands on `path=/` — the `"/"` route renders a `<Navigate to="/onboarding">` redirect. But before React processes that redirect, **whatever is at `/` briefly paints** (this is the `AppWrapper` shell at minimum).
3. **t=1404**: Redirect completes → Onboarding mounts
4. **t=1417**: Slide 1 image finishes loading

There are **two flicker contributors**:
- **Primary**: The `"/"` → `"/onboarding"` redirect takes ~62ms (1342→1404). During this window, the empty AppWrapper shell is visible.
- **Secondary**: The slide image loads 13ms after mount (1404→1417), causing a brief layout shift.

### Why `initialRouteCheckDone` doesn't help

On native, `initialRouteCheckDone` starts as `false`, so `AppRoutes` returns `<AppWrapper />` (the shell) while resolving the startup route. But the splash hides at t=1312 regardless — it doesn't wait for routing to settle. So the user sees the empty AppWrapper during route resolution.

---

## Fix Plan

### Fix 1: Don't hide splash until route has settled (primary fix)

In `AppLoader`, instead of a fixed 1000ms timer, also wait for a signal that the first meaningful content is ready. Add a React context or callback that `OnboardingSlides` (or the Home page) calls once its first paint is done. `AppLoader` keeps showing `SplashScreen` until both conditions are met:
- `isInitializing` is false
- Minimum 1s has elapsed
- **First content route has mounted** (new condition)

Implementation: Add a simple `onReady` callback pattern:
- `AppLoader` provides an `onContentReady` callback via React context
- The destination component (`OnboardingSlides` or `Home`) calls `onContentReady()` on mount (or after image load)
- `AppLoader` only hides splash when all 3 conditions are true

### Fix 2: Pre-resolve the initial route before splash hides (simpler alternative)

Move the `"/"` redirect logic to happen **before** `AppLoader` hides the splash. Since `onboardingDone` is a synchronous localStorage read, we can determine the correct initial route immediately and use `initialEntries` or navigate before the splash drops.

Simplest approach: In `AppRoutes`, when `!initialRouteCheckDone`, return `<SplashScreen />` instead of `<AppWrapper />`. This keeps the splash visible during route resolution on native.

### Fix 3: Preload onboarding image (secondary fix)

Add a `<link rel="preload">` for `/assets/onboarding1-1.png` in `index.html` so the image is cached before the slide mounts, eliminating the 13ms layout shift.

### Recommended Approach: Fix 2 + Fix 3

**Changes:**

1. **`src/App.tsx`** — In the `if (!initialRouteCheckDone)` block (line 1011-1013), return `<SplashScreen />` instead of `<AppWrapper />` so splash stays visible during native route resolution.

2. **`src/components/AppLoader.tsx`** — After the 1000ms timer fires and splash hides, use `<Navigate>` to go directly to the correct route (`/onboarding` or `/home`) instead of landing on `/` first. Since `onboardingDone` is synchronous, read it in AppLoader and pass it to the initial redirect.

3. **`index.html`** — Add `<link rel="preload" as="image" href="/assets/onboarding1-1.png">` in `<head>` to pre-cache the first slide image.

4. **Remove debug toasts** — Strip all `[REMOVABLE-DEBUG-TOAST]` lines after confirming the fix.

