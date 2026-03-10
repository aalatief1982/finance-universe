

## Issues Identified

### 1. Language change breaks Swiper direction (critical)
The `<Swiper>` component has no RTL awareness. When the user switches to Arabic, `document.dir` changes to `rtl` but Swiper doesn't reinitialize. Swiper needs an explicit `dir` prop and a `key` to force remount when language changes, otherwise slides swipe the wrong direction into blank space.

### 2. First slide has extra top padding (margin mismatch)
Line 189: `style={index === 0 ? { paddingTop: '2rem' } : undefined}` — the first slide gets 2rem extra padding that slides 2 and 3 don't. This causes visible layout inconsistency.

### 3. Splash-to-onboarding flicker
The onboarding container starts with `opacity-0` and transitions to `opacity-100` when the image loads. Combined with the 800ms fallback timer, there can be a visible flash. The transition should be tighter.

---

## Plan

### File 1: `src/onboarding/OnboardingSlides.tsx`

**Fix A — Swiper RTL + remount on language change:**
- Import `useLanguage` already exists. Use `language` to derive `isRtl`.
- Add `key={language}` to `<Swiper>` so it fully remounts when language changes (Swiper caches direction internally).
- Add `dir={isRtl ? 'rtl' : 'ltr'}` prop to `<Swiper>`.
- Reset `index` to `0` when language changes (via `useEffect` on `language`).

**Fix B — Remove first-slide-only padding:**
- Line 189: Remove the conditional `style={index === 0 ? { paddingTop: '2rem' } : undefined}` so all slides share the same layout.

**Fix C — Reduce flicker opacity transition:**
- Line 138: Change `transition-opacity duration-200` to `duration-150` and reduce the 800ms content-ready fallback to 400ms (line 92) to tighten the handoff window.

