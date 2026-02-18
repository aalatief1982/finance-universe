
## Safe Area Fix: Onboarding Slides — Full Top & Bottom Coverage

### How the Rest of the App Handles Safe Area (Confirmed)

Every normal page in the app relies on two mechanisms:

1. **`index.css` line 131** — `body { padding-top: var(--safe-area-top) }` — this globally pushes all body content below the notch/status bar.
2. **`Header.tsx` line 45** — `pt-[var(--safe-area-top)]` on the fixed header so the header bar itself clears the notch.
3. **`Layout.tsx` line 63** — `pt-[var(--safe-area-top)]` when no header is shown but `safeAreaPadding` is true.

### Why Onboarding Cannot Use Those Mechanisms

`Onboarding.tsx` explicitly opts out of both:
- `safeAreaPadding={false}` is passed to Layout — so Layout's `pt-[var(--safe-area-top)]` does **not** fire.
- `StatusBar.setOverlaysWebView({ overlay: true })` is called — the native status bar overlays the WebView, meaning the body `padding-top` from `index.css` no longer reliably pushes content below the notch on native.

This means `OnboardingSlides.tsx` must handle its own safe area from scratch — top **and** bottom — using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` inline styles, exactly as the rest of the app uses `var(--safe-area-top)` and `pb-safe-bottom`.

---

### What Is Currently Wrong in `OnboardingSlides.tsx`

| Location | Current Code | Problem |
|---|---|---|
| Progress dots (line 89) | `env(safe-area-inset-top, 0px) + 8px` inline style | ✓ Already fixed |
| Slide header — icon + title + text (line 123) | `pt-16` (64px hardcoded) | ✗ Does not adapt to notch height |
| Action section bottom (line 161) | `safe-area-inset-bottom` Tailwind class | ✗ Not a valid Tailwind class — does nothing |

---

### The Fix — 2 Lines in `OnboardingSlides.tsx`

**Fix 1 — Slide header (line 123):**

Remove `pt-16` from the className and add an inline style using `env(safe-area-inset-top)`. The approach exactly mirrors how `Header.tsx` and `Layout.tsx` work — they use `var(--safe-area-top)` which resolves to `env(safe-area-inset-top, 0px)`. We add `3.5rem` (56px) of visual breathing room on top of the safe area inset, replacing what `pt-16` (64px) was previously providing:

```tsx
// Before:
<div className={`relative pt-16 pb-4 bg-gradient-to-b ${slide.gradient} shrink-0`}>

// After:
<div
  className={`relative pb-4 bg-gradient-to-b ${slide.gradient} shrink-0`}
  style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)' }}
>
```

Why `3.5rem` (56px)?
- `pt-16` = 64px was doing two jobs: clearing the notch (~50px on most devices) + visual gap above the icon (~14px).
- Now the notch is handled dynamically by `env(safe-area-inset-top)`, so 3.5rem is purely visual breathing room.
- On a device with no notch: `0 + 56px = 56px` — slightly less than before, visually identical.
- On a device with a 50px notch: `50 + 56 = 106px` — content safely below status bar.
- On Dynamic Island (59px): `59 + 56 = 115px` — correct.

**Fix 2 — Action section bottom (line 161):**

Replace the invalid `safe-area-inset-bottom` class with an inline style that actually works, mirroring `pb-safe-bottom` which the rest of the app uses via Layout:

```tsx
// Before:
<div className="px-4 pb-4 safe-area-inset-bottom pt-2 shrink-0">

// After:
<div
  className="px-4 pt-2 shrink-0"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
>
```

`1rem` (16px) is the original `pb-4` visual padding. On devices with a home bar (e.g. iPhone without home button), `env(safe-area-inset-bottom)` = ~34px, so total = 34 + 16 = 50px — the button floats above the home bar correctly. On devices with no home bar: `0 + 16px = 16px` — same as before.

---

### What Is NOT Touched

- The progress dots `div` (line 89) — already correct, left untouched.
- The `Swiper`, background decorations, image section, or any other layout element — untouched.
- `Onboarding.tsx`, `Layout.tsx`, `Header.tsx`, `index.css` — untouched.
- Every other page in the app — completely unaffected. This is isolated to 2 `div` elements inside `OnboardingSlides.tsx`.

---

### Summary of Changes

| File | Line | Change |
|---|---|---|
| `src/onboarding/OnboardingSlides.tsx` | 123 | Remove `pt-16`, add inline `paddingTop: calc(env(safe-area-inset-top, 0px) + 3.5rem)` |
| `src/onboarding/OnboardingSlides.tsx` | 161 | Remove invalid `safe-area-inset-bottom pb-4`, add inline `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + 1rem)` |
