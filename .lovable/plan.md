
# Two Fixes: Global Status Bar Color + Onboarding Scroll Lock

## Root Cause Diagnosis

### Why Onboarding Still Scrolls

The `OnboardingSlides` outer container uses `height: 100dvh` but the **`body` element in `index.css` line 132 has `padding-top: var(--safe-area-top)`**. This means the `body` itself is taller than the viewport — `body height = 100dvh + safe-area-top`. So even though the container says `height: 100dvh`, the *page* (body) can scroll because there is extra space below the viewport.

The `marginTop: calc(-1 * env(safe-area-inset-top, 0px))` approach tried to compensate but it only shifts the container visually — it does NOT remove the extra body height. On devices/browsers where the safe area is 0px (web preview), this fallback is invisible, but on native the body is still taller.

The correct fix: the **`Onboarding` page wrapper** (`src/pages/Onboarding.tsx`) must use `position: fixed; inset: 0; overflow: hidden` on its Layout wrapper — this takes the onboarding completely out of normal document flow, so the body's extra padding-top has zero effect. This is the standard "poster/fullscreen" native pattern.

### Global Status Bar Color

`App.tsx` line 118-120 sets the status bar to **transparent overlay** (`overlay: true`, `color: #00000000`, `Style.Light`) for the entire app. This needs to change to `overlay: false`, `color: #0097a0`, `Style.Dark` (dark icons on teal background, which has sufficient contrast). The onboarding-specific status bar code then becomes consistent with this global default, so both onboarding and all other pages show the same teal status bar.

---

## Changes — Two Files Only

### File 1: `src/pages/Onboarding.tsx`

**The scroll fix.** Wrap the Layout output with `position: fixed; inset: 0; overflow: hidden`. This takes the entire onboarding out of the scrollable document flow. The page is literally pinned to the screen like a poster — no matter how tall the body is, the onboarding cannot scroll.

Change the `Layout` props and add a `style` to make the root fixed:

```tsx
// Before:
return (
  <Layout
    hideNavigation
    showHeader={false}
    withPadding={false}
    fullWidth
    className="w-full overflow-hidden"
    safeAreaPadding={false}
  >
    <OnboardingSlides onComplete={handleComplete} />
  </Layout>
);

// After:
return (
  <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
    <Layout
      hideNavigation
      showHeader={false}
      withPadding={false}
      fullWidth
      className="w-full h-full overflow-hidden"
      safeAreaPadding={false}
    >
      <OnboardingSlides onComplete={handleComplete} />
    </Layout>
  </div>
);
```

This `fixed` wrapper:
- Pins the onboarding to the screen — zero document flow
- `overflow: hidden` at the container level prevents any bounce/scroll
- Has zero effect on any other page (it only wraps this component)
- Does NOT change `index.css`, `Layout.tsx`, or any global style

### File 2: `src/App.tsx` — Global Status Bar (lines 117–125)

Change the app-wide status bar setup from transparent overlay to teal solid:

```tsx
// Before (lines 117-125):
try {
  await StatusBar.setOverlaysWebView({ overlay: true });
  await StatusBar.setBackgroundColor({ color: '#00000000' });
  await StatusBar.setStyle({ style: Style.Light });
} catch (err) { ... }

// After:
try {
  await StatusBar.setOverlaysWebView({ overlay: false });
  await StatusBar.setBackgroundColor({ color: '#0097a0' });
  await StatusBar.setStyle({ style: Style.Dark });
} catch (err) { ... }
```

- `overlay: false` — status bar has its own opaque background (not transparent)
- `color: '#0097a0'` — exact hex requested by user (matches `hsl(183, 100%, 32%)` from CSS vars)
- `Style.Dark` — dark/black icons on the teal background (correct contrast)

This guard is only inside `if (platform === 'android')` — so it only runs on Android. iOS status bar style is handled natively by the app's `Info.plist`. This is the right scope.

### File 3: `src/onboarding/OnboardingSlides.tsx` — Align Onboarding Status Bar with App Default

Since the app now defaults to teal (`#0097a0`), the onboarding cleanup (unmount) must restore to that same state — not transparent. Also align the onboarding mount to use the exact same color `#0097a0`:

```tsx
// Mount — change color to match app global:
await StatusBar.setBackgroundColor({ color: '#0097a0' }); // was #009fa8

// Cleanup — restore to app default (teal, not transparent):
StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
StatusBar.setBackgroundColor({ color: '#0097a0' }).catch(() => {});
StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
```

---

## Summary

| File | Change | Scope |
|---|---|---|
| `src/pages/Onboarding.tsx` | Wrap Layout in `position: fixed; inset: 0; overflow: hidden` | Onboarding only |
| `src/App.tsx` | Status bar: overlay=false, color=#0097a0, Style.Dark | Android app-wide |
| `src/onboarding/OnboardingSlides.tsx` | Align mount+cleanup color to #0097a0 | Onboarding status bar |

## What Is NOT Touched
- `index.css` — no global changes
- `Layout.tsx` — no changes
- All non-onboarding pages — completely unaffected
- Images — untouched
- Routing/navigation logic — untouched

## Manual Test Checklist
- **Onboarding — no scroll:** Pull down on any slide — page stays frozen, no bounce
- **Onboarding — status bar:** Teal (#0097a0) with dark icons
- **Post-onboarding (Home/Analytics etc):** Status bar remains teal, not transparent
- **Small Android:** Button above nav bar, no content clipped
- **iPhone notch:** Header clears notch with existing safe-area padding
- **Landscape:** Slides stay within screen, no overflow
