# Startup Flicker Investigation (Splash ➜ Onboarding Slide 1)

## Scope
- Investigate splash-to-onboarding flicker during Android app startup.
- No UI redesign and no image asset changes.
- No runtime code changes in this task; this is evidence + plan.

## Startup pipeline (current)
1. **Android launch theme splash**
   - `MainActivity` uses `@style/AppTheme.NoActionBarLaunch` as activity theme.
   - Capacitor Splash plugin config sets `launchShowDuration: 0`.
2. **Web bootstrap loader in `index.html`**
   - `#initial-loading` is rendered inside `#root` before React and hidden on `window.load` + 100ms timeout.
3. **React in-app splash**
   - `AppWithLoader` renders `<AppLoader isInitializing={initializing}>`.
   - `AppLoader` shows React `SplashScreen` while `showSplash` is true, and keeps it for a hardcoded minimum 1s once initialization is complete.
4. **Router decision and first route**
   - First route decision for `/` is synchronous: redirect to `/home` or `/onboarding` based on `safeStorage.getItem('xpensia_onb_done')`.
   - For not-onboarded users, route resolves to `/onboarding` and mounts `OnboardingSlides`.
5. **Onboarding slide 1 image render**
   - Slide image is rendered via `<img src="/assets/onboarding1-1.png" ...>` with no preload/decode gating and no `onLoad` readiness gate.

## Evidence-based root cause hypothesis

### Primary cause: multi-stage splash chain with uncoordinated handoff timing
There are **three splash surfaces** (native launch splash, HTML initial-loading overlay, React splash component), and none of them are synchronized to "first onboarding frame ready". This increases chance of visible flash between stages.

- Native plugin configured with immediate launch dismissal window (`launchShowDuration: 0`), with no manual hide sequencing tied to app paint readiness.
- HTML loader hides on `window.load` (+100ms), which is not tied to React route readiness.
- React splash hides on a fixed timer (1s after init complete), also not tied to onboarding first slide image decode.

### Secondary cause: onboarding first-slide image is not readiness-gated
Onboarding renders slide image directly with no preload/decode/onLoad gating, so first visual frame can transition before hero image is decoded, producing perceived flash/pop.

### Secondary contributor: possible theme/background transition mismatch
Android launch theme setup does not show explicit `postSplashScreenTheme` handoff in launch style variants, while web and React splash backgrounds are dynamic theme-based HSL backgrounds and onboarding uses gradient + overlay. This can surface a short mismatch frame during transitions.

## Contributing factors found
- Native splash handoff not explicitly coordinated to first React paint.
- HTML `#initial-loading` and React `SplashScreen` both active in startup path (double web splash layer).
- React splash minimum timer is fixed-time based, not content-readiness based.
- First onboarding image is not pre-decoded before showing onboarding frame.
- Status bar appearance is updated per-route (including onboarding), potentially adding a small visual transition during route entry.

## Lightweight instrumentation plan (temporary; do not keep in final)
Add timestamped markers with `performance.now()` + `Date.now()` to verify frame where flicker occurs:

1. `src/main.tsx`
   - `BOOT_START` before `initializeCapacitor()`.
   - `REACT_ROOT_RENDER` right before `root.render(<AppWithLoader />)`.
2. `src/components/AppLoader.tsx`
   - `APP_INIT_DONE` when `isInitializing` flips false.
   - `REACT_SPLASH_HIDE` when `setShowSplash(false)` runs.
3. `src/App.tsx`
   - `ROUTE_DECISION` log `onboardingDone` at `AppRoutes()` render.
   - `FIRST_ROUTE_MOUNT` in `AppWrapper` effect with `location.pathname`.
   - `STATUSBAR_APPLY` around `applyStatusBarForRoute` for `/onboarding`.
4. `src/pages/Onboarding.tsx`
   - `ONBOARDING_MOUNT` in mount effect.
5. `src/onboarding/OnboardingSlides.tsx`
   - `ONBOARDING_SLIDE1_IMG_LOAD` and `..._ERROR` via `onLoad/onError` for first slide image.
6. `index.html`
   - `INITIAL_HTML_LOADER_HIDE` when `#initial-loading` is hidden.
7. (If adding native instrumentation) `MainActivity.java`
   - log `NATIVE_ACTIVITY_ONCREATE_START/END`.

Use these logs to map timeline and classify flicker as:
- blank frame,
- background mismatch frame,
- layout jump (safe area/status bar),
- font swap,
- image decode flash.

## Ranked fix options (minimal/reversible, no startup slowdown)

### Option 1 (least invasive): synchronize one handoff + remove duplicate web splash layer
**Files:**
- `index.html`
- `src/components/AppLoader.tsx`
- (optional) `src/main.tsx` for sequencing signal

**Plan:**
- Keep only one web-level splash surface during React bootstrap (prefer React `AppLoader` splash).
- Remove or simplify `#initial-loading` auto-hide script so handoff is single-stage and deterministic.
- Ensure transition occurs only once, on React readiness.

**Why it helps:**
Eliminates one transition boundary where flash can occur.

**Risk/side effects:**
- Very low risk.
- Need to ensure no blank frame before React mounts (can keep minimal fallback container background).

### Option 2: gate splash hide by first route readiness (and onboarding first image readiness for new users)
**Files:**
- `src/components/AppLoader.tsx`
- `src/App.tsx`
- `src/onboarding/OnboardingSlides.tsx`

**Plan:**
- Replace fixed 1s splash timer with readiness signal:
  - route resolved + first route mounted;
  - if `/onboarding`, wait until first-slide image decode/load event before hiding splash.
- Keep a hard max timeout (e.g., 1200ms) as fallback to avoid startup regressions.

**Why it helps:**
Removes timing race between splash hide and first onboarding paint.

**Risk/side effects:**
- Moderate complexity.
- Must avoid deadlock if image fails; include fallback timeout.

### Option 3: native-theme continuity and background alignment hardening
**Files:**
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/values-v23/styles.xml`
- `android/app/src/main/res/values-night-v23/styles.xml`
- possibly `capacitor.config.ts`

**Plan:**
- Ensure launch theme declares explicit post-splash app theme handoff and consistent splash/background color values across day/night + API variants.
- Align root/background colors with onboarding container base tone.

**Why it helps:**
Prevents short white/contrast frames during native ➜ web transition.

**Risk/side effects:**
- Low to moderate (Android theme behavior can vary by API/device).
- Requires testing on Android 12+ and older APIs.

## Android verification checklist (post-fix)
- Cold start
  - fresh install (onboarding path)
  - returning user (home path)
- Warm start (resume from recents)
- Slow-device simulation
  - throttled CPU/GPU if available, or low-end physical device
- Validate no onboarding UI/content changes
- Confirm no startup slowdown (time-to-interactive not regressed)

## Proposed execution order
1. Instrument and capture timeline on real Android device.
2. Apply **Option 1** first (lowest risk).
3. If residual flicker persists, apply **Option 2**.
4. Apply **Option 3** only if logs/video show native-theme mismatch frames.
