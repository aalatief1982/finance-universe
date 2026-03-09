

## Plan: Add Visual Debug Breakpoints to Splash → Onboarding Startup Path

### Goal
Insert temporary, visually obvious debug toasts/alerts at each major transition step in the startup pipeline so you can screenshot each stage on a real Android device.

### Approach
Use a **URL query param** `?debugStartup=1` to gate all debug overlays. When absent, zero runtime impact. When present, each breakpoint shows a **blocking alert dialog** (not a toast — toasts auto-dismiss and you'd miss them) with the step name + timestamp + key state values. You dismiss each manually after screenshotting.

We'll use `window.alert()` for simplicity — it blocks execution, guarantees you see it, and requires no UI component work. Each alert includes a numbered step ID for easy ordering.

### Breakpoint Locations (12 steps)

| # | File | Location | What It Captures |
|---|---|---|---|
| 1 | `src/main.tsx` | Before `initializeCapacitor()` | Boot start, timestamp |
| 2 | `src/main.tsx` | After `root.render()` | React root rendered |
| 3 | `src/main.tsx` | Inside `hideInitialLoading` callback | HTML loader hide moment |
| 4 | `src/AppWithLoader.tsx` | Start of `initialize()` | Init sequence start |
| 5 | `src/AppWithLoader.tsx` | After `setInitializing(false)` | Init complete |
| 6 | `src/components/AppLoader.tsx` | When `setShowSplash(false)` fires | React splash hide moment |
| 7 | `src/App.tsx` (`AppRoutes`) | At `initialRouteCheckDone` false branch | Splash still showing in router |
| 8 | `src/App.tsx` (`AppRoutes`) | After route decision, before return | Route decided: shows target path, onboardingDone value |
| 9 | `src/pages/Onboarding.tsx` | Mount effect | Onboarding page mounted |
| 10 | `src/onboarding/OnboardingSlides.tsx` | Mount effect | Slides component mounted |
| 11 | `src/onboarding/OnboardingSlides.tsx` | First slide image `onLoad` | Slide 1 image decoded |
| 12 | `src/onboarding/OnboardingSlides.tsx` | First slide image `onError` | Slide 1 image failed |

### Implementation Details

**Gate mechanism:** Read `debugStartup` from URL once at module level:
```ts
const DEBUG_STARTUP = new URLSearchParams(window.location.search).get('debugStartup') === '1';
```

**Alert format:**
```
[XPENSIA DEBUG #3] HTML Loader Hide
Time: 142.35ms
```

Each file that needs the gate reads it independently (no shared import needed — it's a one-liner).

### Files Changed
- `src/main.tsx` — 3 breakpoints (#1, #2, #3)
- `src/AppWithLoader.tsx` — 2 breakpoints (#4, #5)
- `src/components/AppLoader.tsx` — 1 breakpoint (#6)
- `src/App.tsx` — 2 breakpoints (#7, #8) in `AppRoutes` function
- `src/pages/Onboarding.tsx` — 1 breakpoint (#9)
- `src/onboarding/OnboardingSlides.tsx` — 3 breakpoints (#10, #11, #12)

### Removal
All breakpoints are gated by `debugStartup=1` query param. To remove later, search for `DEBUG_STARTUP` or `XPENSIA DEBUG` and delete.

### No-Touch Guarantee
- No layout, styling, or routing changes
- No behavioral changes when param is absent
- Alerts only fire on `?debugStartup=1`

