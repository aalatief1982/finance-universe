

## Plan: Add Debug Toasts for Splash-to-Onboarding Flicker Investigation

All toasts prefixed with `[DBG-FLICKER]` and marked with `// [REMOVABLE-DEBUG-TOAST]` for easy cleanup.

### Flicker Pipeline & Toast Placement

The startup has 3 splash layers that hand off sequentially:
1. **Native Android splash** → 2. **HTML `#initial-loading`** → 3. **React `SplashScreen`** → 4. **Route renders (Onboarding)**

Each handoff is a potential flicker point.

---

### Toast Locations

**`index.html`** (1 toast via inline script — can't use React toast here, so we'll store timestamp on `window` for later reporting)

- Store `window.__flickerTimestamps.htmlLoaderHide` when `#initial-loading` is removed. React will read this later.

**`src/main.tsx`** (2 toasts)

- **Toast 1**: Before `root.render()` — `[DBG-FLICKER] 1: React render called | t=[perf.now]`
- **Toast 2**: After `hideInitialLoading()` — `[DBG-FLICKER] 2: HTML loader hide triggered | t=[perf.now]`

Note: These fire before React mounts, so we'll store on `window` and report them from AppLoader.

**`src/components/AppLoader.tsx`** (4 toasts)

- **Toast 3**: On mount — `[DBG-FLICKER] 3: AppLoader mounted | initializng=[bool] | t=[perf.now]`
- **Toast 4**: When `isInitializing` flips false — `[DBG-FLICKER] 4: Init done | t=[perf.now]`
- **Toast 5**: When 1000ms timer fires (splash hide) — `[DBG-FLICKER] 5: Splash hiding | t=[perf.now]`
- **Toast 6**: Report early timestamps from `window.__flickerTimestamps` — `[DBG-FLICKER] 6: Timeline | renderCall=[t1] | htmlHide=[t2] | mount=[t3] | initDone=[t4] | splashHide=[t5]`

**`src/App.tsx`** (2 toasts)

- **Toast 7**: In `AppRoutes` render — `[DBG-FLICKER] 7: Route decided | path=[path] | onboardingDone=[bool] | t=[perf.now]`
- **Toast 8**: In `AppWrapper` mount effect — `[DBG-FLICKER] 8: AppWrapper mounted | path=[path] | t=[perf.now]`

**`src/pages/Onboarding.tsx`** (1 toast)

- **Toast 9**: On mount — `[DBG-FLICKER] 9: Onboarding mounted | t=[perf.now]`

**`src/onboarding/OnboardingSlides.tsx`** (3 toasts)

- **Toast 10**: On mount — `[DBG-FLICKER] 10: OnboardingSlides mounted | t=[perf.now]`
- **Toast 11**: On slide 1 image `onLoad` — `[DBG-FLICKER] 11: Slide1 image loaded | naturalW=[w] | t=[perf.now]`
- **Toast 12**: On slide 1 image `onError` — `[DBG-FLICKER] 12: Slide1 image FAILED | t=[perf.now]`

**`src/components/SplashScreen.tsx`** (1 toast)

- **Toast 13**: On mount — `[DBG-FLICKER] 13: SplashScreen component mounted | t=[perf.now]`

---

### Files to Change

| File | Toasts | Notes |
|------|--------|-------|
| `index.html` | timestamp capture | Store on `window.__flickerTimestamps` |
| `src/main.tsx` | 1-2 (store on window) | Pre-React, so store for later |
| `src/components/SplashScreen.tsx` | 13 | Mount timing |
| `src/components/AppLoader.tsx` | 3-6 | Core handoff + timeline report |
| `src/App.tsx` | 7-8 | Route decision + wrapper mount |
| `src/pages/Onboarding.tsx` | 9 | Page mount |
| `src/onboarding/OnboardingSlides.tsx` | 10-12 | Slides mount + image load |

### What These Toasts Will Reveal

On device, you'll see a numbered sequence of toasts that maps the exact timeline. The gap between toast 5 (splash hide) and toast 11 (slide 1 image loaded) is where the flicker lives. Toast 6 provides a summary timeline in one view. If toast 12 fires instead of 11, the image is failing to load entirely.

