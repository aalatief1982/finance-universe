# Onboarding Safe-Area Alignment Plan (Codebase Audit)

## What the current app does on non-onboarding pages

1. **Shared layout handles safe areas by default**
   - `Layout` applies top inset when header is hidden (`pt-[var(--safe-area-top)]`) and bottom inset on mobile content wrappers (`pb-safe-bottom`) via `safeAreaPadding = true` default.
2. **Header-based pages handle top inset in one place**
   - `Header` includes `pt-[var(--safe-area-top)]`, so pages with the standard header get safe top spacing consistently.
3. **Design tokens/utilities are the reusable source of truth**
   - `--safe-area-top` is defined in global tokens/CSS.
   - Bottom handling is exposed through utility class (`.safe-area-bottom`) and Tailwind utility usage (`pb-safe-bottom`).

## What onboarding does today

1. `Onboarding` disables layout-level safe-area handling (`safeAreaPadding={false}`), so it opts out of shared behavior.
2. `OnboardingSlides` applies safe-area spacing manually in multiple places using inline `env(safe-area-inset-*)` expressions.
3. This works, but it is inconsistent with the rest of the app’s centralized layout/token approach and increases maintenance risk.

## Proposed plan to align onboarding with app-wide safe-area handling

### Phase 1 — Consolidate safe-area API (no visual change intended)
- Add explicit reusable safe-area utility classes/tokens for onboarding needs (e.g., `pt-safe-top`, `pb-safe-bottom`, and optional offset variants) so onboarding no longer relies on ad-hoc inline `env(...)` values.
- Keep values mapped to the same design-token system used by `Layout`/`Header`.

### Phase 2 — Refactor onboarding to shared primitives
- Replace inline safe-area styles in `OnboardingSlides` with the shared utilities from Phase 1.
- Keep `safeAreaPadding={false}` on `Onboarding` if full-screen onboarding still needs custom composition, but use the same utilities as the rest of the app.

### Phase 3 — Verify parity and edge cases
- Validate on:
  - iOS notch devices (top inset + bottom home indicator)
  - Android gesture navigation
  - Browser mobile emulation (fallback `0px` insets)
- Confirm no regressions in these onboarding zones:
  - top progress indicator
  - hero/header section spacing
  - bottom CTA and helper text visibility

### Phase 4 — Optional hardening
- If offsets are reused elsewhere, promote them to named CSS variables (e.g., `--onboarding-progress-offset`) rather than inline `calc(...)` constants.
- Add a lightweight visual regression snapshot for onboarding first/last slides to prevent safe-area regressions.

## Suggested implementation order (small, low-risk PRs)

1. Introduce/reuse tokenized safe-area utility classes.
2. Refactor onboarding styles to use utilities only.
3. Run UI checks on iOS/Android/web responsive modes.
4. (Optional) Add regression coverage.

## Acceptance criteria

- Onboarding no longer contains direct `env(safe-area-inset-*)` inline styles.
- Safe-area behavior on onboarding matches app conventions (tokenized + reusable utilities).
- First and last onboarding slides remain visually equivalent (or intentionally improved) on notch and non-notch devices.
