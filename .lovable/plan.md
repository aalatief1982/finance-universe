

## Flicker Isolation Plan

### Approach

Instead of guessing at the root cause, we create 3 diagnostic test modes controlled by a single `__FLICKER_DIAG` flag on `window`. The user sets `window.__FLICKER_DIAG = 1|2|3` in the browser console (or we add a URL param `?flickerDiag=1`) before a cold start, then observes which variant flickers.

### Test Variants

**Variant 1 -- Static placeholder (no image, no animations, no Swiper)**
Replace OnboardingSlides with a flat colored `div` + static text. If flicker persists, the problem is in the splash/AppLoader/route handoff layer, not in onboarding content.

**Variant 2 -- Real layout, animations disabled**
Render the real OnboardingSlides structure but strip `animate-fade-in`, `animate-slide-up`, `animate-scale-in` classes from slide 1, and remove the Swiper fade effect. If flicker disappears, animations are the culprit.

**Variant 3 -- Real layout + animations, but fixed image container dimensions**
Keep everything real, but give the image container explicit `width`/`height` (e.g. 280x400) so there's no layout shift while the image loads. If flicker disappears, the cause is CLS from the image.

### Implementation

**File: `src/pages/Onboarding.tsx`** (primary change)
- Read diag mode from URL param `?flickerDiag=N` on mount.
- If mode `1`, render a static placeholder div instead of `<OnboardingSlides>`.
- If mode `2` or `3`, pass a prop `flickerDiag={N}` to `<OnboardingSlides>`.

**File: `src/onboarding/OnboardingSlides.tsx`**
- Accept optional `flickerDiag` prop.
- Mode `2`: Strip animation classes from slide wrapper, title, subtitle, description, and image. Remove `animate-fade-in` from the slide `div`, `animate-slide-up` from text, `animate-scale-in` from img.
- Mode `3`: Add explicit `style={{ width: 280, height: 400 }}` to the image container div, and `style={{ width: 280, height: 360 }}` to the `<img>` element, keeping all animations intact.

**No changes to**: `AppLoader.tsx`, `SplashScreen.tsx`, `App.tsx`, `index.html`, `main.tsx`.

### Diagnostic static placeholder (Variant 1)

Rendered in `Onboarding.tsx` when `flickerDiag=1`:
```tsx
<div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
  <div className="text-center space-y-4">
    <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto" />
    <h1 className="text-2xl font-bold text-foreground">Static Placeholder</h1>
    <p className="text-muted-foreground">No image, no animation, no Swiper</p>
  </div>
</div>
```

### How to test

1. Build APK with these changes.
2. Fresh install, cold start with URL param or set flag before navigating:
   - **No param**: Normal behavior (baseline).
   - `?flickerDiag=1`: Static placeholder. If flicker persists → splash/route handoff is the issue.
   - `?flickerDiag=2`: No animations. If flicker disappears → animations cause it.
   - `?flickerDiag=3`: Fixed image dims. If flicker disappears → image CLS causes it.
3. Record screen for each variant and compare.

### Files changed

| File | Change |
|------|--------|
| `src/pages/Onboarding.tsx` | Read `flickerDiag` param, render static placeholder for mode 1, pass prop for 2/3 |
| `src/onboarding/OnboardingSlides.tsx` | Accept `flickerDiag` prop, conditionally strip animations (2) or fix image dims (3) |

All changes are temporary diagnostic code, clearly marked with `// [REMOVABLE-FLICKER-DIAG]` for cleanup.

