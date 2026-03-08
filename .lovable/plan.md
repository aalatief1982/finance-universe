

## Fix Onboarding: Language Selector Position + Blank Slides

### Issues Identified

1. **Language selector** is too small and centered — needs to be top-left, larger, below the status bar with safe-area padding
2. **Slides 2 and 3 are blank** — the `animate-fade-in` class on each slide's wrapper div conflicts with Swiper's `EffectFade`. Swiper fade uses `opacity` on `.swiper-slide` elements, and the inner `animate-fade-in` animation (0.3s, no `fill-mode: forwards`) runs on mount for all slides simultaneously. By the time the user swipes to slides 2/3, the animation has completed but the interaction between Swiper's opacity control and the animation's initial `opacity: 0` state causes rendering issues.
3. **No button on last slide** — this is a consequence of slide 3 being blank; the button markup exists but is invisible.

### Fix 1: Language Selector (OnboardingSlides.tsx, line 134-146)

- Move from `left-1/2 -translate-x-1/2` (centered) to `left-4 rtl:left-auto rtl:right-4` (top-left, RTL-aware)
- Add `top` with `calc(env(safe-area-inset-top, 0px) + 0.75rem)` to sit below status bar
- Increase font size from `text-sm` to `text-base`, padding from `px-3 py-1.5` to `px-4 py-2.5`
- Make the dropdown arrow larger

### Fix 2: Blank Slides (OnboardingSlides.tsx, line 177)

- Remove `animate-fade-in` from the slide wrapper div entirely — Swiper's fade effect already handles cross-fade transitions between slides, so a separate fade-in animation is redundant and harmful
- This single change fixes both the blank slides AND the missing button on slide 3

### Fix 3: Animation fill-mode (tailwind.config.ts)

- Add `forwards` fill-mode to `fade-in`, `slide-up`, and `scale-in` animations as a safety net (e.g., `'fade-in': 'fade-in 0.3s ease-out forwards'`)
- This ensures any remaining uses of these animations hold their final state

### Files to Modify

| File | Change |
|------|--------|
| `src/onboarding/OnboardingSlides.tsx` | Reposition language selector; remove `animate-fade-in` from slide wrapper |
| `tailwind.config.ts` | Add `forwards` fill-mode to `fade-in`, `slide-up`, `scale-in` animations |

### No other files affected. Smart Entry, navigation, and all other features remain untouched.

