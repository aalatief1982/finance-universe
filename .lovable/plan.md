
# Onboarding Bottom Gap — Precise Root Cause & Fix Plan

## Layout Math: What Is Actually Happening

The DOM hierarchy for each non-last slide is:

```text
Onboarding.tsx
  └── <div style="position:fixed; inset:0; overflow:hidden">       ← viewport-locked wrapper (correct)
        └── Layout (min-h-screen flex flex-col, safeAreaPadding=false)
              └── OnboardingSlides outer <div>
                    style: height:100dvh, marginTop: -env(safe-area-inset-top), paddingTop: env(safe-area-inset-top)
                    └── Swiper (h-full, height:100%)
                          └── SwiperSlide
                                └── <div class="flex flex-col flex-1 min-h-0 h-full">
                                      ├── [A] Header block         shrink-0, pt-8
                                      ├── [B] Image section        flex-1, max-h-[40vh]
                                      └── [C] Footer               shrink-0, pb-4
                                              └── "Swipe to continue" in h-16
```

### The Exact Problem: `Layout` has `min-h-screen` AND `flex-1`

Look at `Layout.tsx` line 61:

```tsx
className={cn(
  "min-h-screen flex flex-col",   // ← min-h-screen on an already fixed container
  ...
)}
```

Even though `Onboarding.tsx` wraps everything in `position: fixed; inset: 0`, the `Layout` inner div still gets `min-h-screen` applied to it. On Android, `100vw` is fine, but `min-h-screen` = `100vh` = **the full scrollable viewport height including any browser chrome that adds extra height**.

Inside that `Layout`, there is `<div class="flex flex-1">` → `<main class="flex-1 w-full">` → `<div class="h-full">` → `<motion.div>` wrapping `OnboardingSlides`. The `motion.div` has **no explicit height**, so it collapses — and `OnboardingSlides` then renders with its own `height: 100dvh`. Now you have:

- **Outer fixed container:** `inset: 0` = screen height
- **Layout div:** `min-h-screen` = can be taller than fixed parent
- **OnboardingSlides:** `height: 100dvh` inside the above

The `SwiperSlide` content div (`flex flex-col flex-1 min-h-0 h-full`) correctly fills the Swiper, but **`h-full` here resolves to the Swiper container's 100%, which in turn resolves to `100dvh` of OnboardingSlides** — so far so good.

### The Real Gap Cause: Image Section `flex-1` + `max-h-[40vh]`

Block [B] — Image section — is:
```tsx
<div className="flex-1 flex items-center justify-center px-4 min-h-0">
  <div className="relative w-full max-w-xs h-full max-h-[40vh] ...">
```

`flex-1` means it takes ALL remaining vertical space after [A] header and [C] footer. On a tall device (like the one in the screenshot — it appears to be a tall Samsung with ~900px+ screen height), the calculation is:

```
Total height:   ~860px (100dvh on this device)
[A] header:     ~200px (icon + title + subtitle + description + pt-8)
[C] footer:     ~64px  (h-16 + pb-4)
─────────────────────────────────
[B] flex-1:     ~596px  ← image section gets this
```

BUT: The image inner wrapper has `max-h-[40vh]` = `~344px` (40% of 860px). The image itself has `max-h-[35vh]` = `~301px`.

So the image card renders at ~344px, **but the flex-1 container [B] is 596px tall**. The extra **~252px sits as dead space** above/below the image (due to `items-center` centering it). This is the gap you see in the screenshot — the large empty zone between the image card and "Swipe to continue".

On shorter devices the gap is smaller or absent. On taller/newer Android devices (900px+), it becomes very visible.

### Why the Footer Gap at the Very Bottom (Original Issue)

Separately, on slides 1 and 2, the footer "Swipe to continue" is in:
```tsx
<div className="h-16 flex items-center justify-center">
```
`h-16 = 64px`. This is `shrink-0`, so it keeps 64px regardless of screen. The `pb-4` (16px) on the parent action section adds below it. No bottom safe-area padding is applied here (the `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + 1rem)` is only on the action section div, which includes `pb-4` hardcoded). On Android gesture-nav devices, the gesture pill (home indicator) sits on top of this 16px bottom padding — sometimes appearing to leave a gap if the system's gesture area is larger than 16px.

---

## Root Cause Summary

**Primary cause of the large mid-screen gap:** Image section (`flex-1`) takes all remaining vertical space, but the image itself is constrained to `max-h-[40vh]`. On tall devices, `flex-1` gives the section 500-600px while the image only renders at 300-350px. The `items-center` centering creates equal blank space above and below the image — visually appearing as a dead zone.

**Secondary cause (bottom strip):** The footer on non-last slides (`h-16`) has only `pb-4` (16px) as bottom breathing room. No `env(safe-area-inset-bottom)` is applied to this path, unlike the last slide's button. Android gesture navigation bars can be 20-48px, eating into or exceeding this 16px.

---

## Exact Files Involved

| File | Lines | Issue |
|---|---|---|
| `src/onboarding/OnboardingSlides.tsx` | 130–147 | Image section `flex-1` with capped `max-h-[40vh]` creates dead space |
| `src/onboarding/OnboardingSlides.tsx` | 163–169 | "Swipe to continue" footer has no `env(safe-area-inset-bottom)` padding |
| `src/onboarding/OnboardingSlides.tsx` | 149 | Parent action div uses `pb-4` on the "Swipe" path, not safe-area aware |

---

## Fix Plan (Minimal, Only `OnboardingSlides.tsx`)

### Fix 1 — Cap the image section height instead of using `flex-1`

Replace `flex-1` on the image section with a fixed max-height that scales proportionally. This stops the image container from growing unbounded on tall devices.

**Before (line 130):**
```tsx
<div className="flex-1 flex items-center justify-center px-4 min-h-0">
  <div className="relative w-full max-w-xs h-full max-h-[40vh] flex items-center justify-center">
```

**After:**
```tsx
<div className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
  <div className="relative w-full max-w-xs flex items-center justify-center" style={{ maxHeight: '42vh' }}>
```

Key changes:
- Remove `h-full` from the inner wrapper — it was making the inner container try to be as tall as the flex-1 parent, then the `max-h-[40vh]` capped it, leaving the unused space **inside** the flex-1 zone
- Change outer `max-h-[40vh]` to be on the inner div where the image actually lives — this way the inner card sizes to its content
- Add `overflow-hidden` to the outer flex-1 div to prevent any paint bleed

The `flex-1` outer div keeps its role (fills remaining space), but the inner content (image card) is now sized by content not parent height, so `items-center justify-center` centers a correctly-sized card with no dead zone.

### Fix 2 — Add safe-area bottom padding to the "Swipe to continue" footer

**Before (line 149):**
```tsx
<div className="px-4 pt-2 pb-4 shrink-0">
```

**After:**
```tsx
<div
  className="px-4 pt-2 shrink-0"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
>
```

This applies the same safe-area-aware padding to BOTH the last slide (button) and the non-last slides ("Swipe to continue") — consistent behavior on all slides, all devices.

---

## Why This Won't Break Other Screens

- **Only `OnboardingSlides.tsx` is modified** — two localized changes
- The `flex-1` outer div still fills remaining space — so the layout stays flex-driven, no fixed pixel heights introduced
- The image still uses `max-h-[35vh]` and `object-contain` — no cropping, no stretching, aspect ratio preserved
- On short devices (iPhone SE, small Android): `flex-1` will give less space, image will render smaller — still within `max-h-[35vh]`, no overflow
- On tall devices: image card renders at its natural size, centered properly, no dead zone
- The `env(safe-area-inset-bottom)` fallback is `0px`, so on web/browser preview it equals `1rem` padding — identical to the current `pb-4` on non-last slides (actually slightly better)

---

## CSS-Only vs Layout-Structure

This is a **layout-structure fix** (changing `h-full` → content-driven sizing on the image inner div). A pure CSS-only approach (adding classes) cannot fix the `h-full` that drives the dead zone without modifying JSX. The change is one attribute removal and one class adjustment — minimal diff.

No global CSS changes. No new CSS files. No changes to `Layout.tsx`, `index.css`, `Onboarding.tsx`, or any other component.

---

## Files Changed

**Only: `src/onboarding/OnboardingSlides.tsx`**
- Line 130: Add `overflow-hidden` to outer image wrapper
- Line 131: Remove `h-full` from inner image wrapper, consolidate `max-h` to inline style on inner div
- Line 149: Replace `pb-4` with `style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}`

## Manual Test Checklist

- **Tall Android (900px+ screen):** Gap between image card and "Swipe to continue" should be gone — card sits centered in a reasonably-sized zone, "Swipe" text is near the bottom
- **Small Android (700px screen):** Layout should look tighter but not broken — image smaller, footer still visible
- **iPhone with notch:** Top header clears notch, bottom "Swipe to continue" clears home indicator
- **Last slide (CTA button):** Verify "Start Your Journey" button + subtitle text spacing unchanged
- **Images:** No cropping, no stretch — aspect ratio maintained on all slides
- **No scroll/bounce:** Fixed wrapper still prevents all vertical movement
