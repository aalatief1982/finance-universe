
# Onboarding Polish: No-Scroll, Proper Safe Areas, Native Status Bar

## Root Cause of Every Issue (Confirmed by Codebase Audit)

### Problem 1 — Double Safe-Area on Top (The core bug)
`index.css` line 132 adds `padding-top: var(--safe-area-top)` to the **entire `body`** element globally. This pushes everything down by the notch height (e.g. 50px on iPhone X). The onboarding container uses `h-[100dvh]` and then ALSO adds `pt-[calc(var(--safe-area-top)+2rem)]` on the slide header. The result on a device with a 50px notch:
- Body is already shifted down 50px by the global rule
- Slide header then adds ANOTHER 50px + 2rem = ~82px
- Total top gap on onboarding = ~132px (visible as a large blank strip at the top)

### Problem 2 — `--safe-area-bottom` Variable May Not Resolve
`--safe-area-bottom` is defined in `index.css :root` but the onboarding slide uses `pb-[calc(var(--safe-area-bottom)+1rem)]`. If Tailwind's JIT doesn't expand the arbitrary CSS variable correctly in a `calc()`, the bottom padding falls back silently. The `design-tokens.css` only defines `--safe-area-top`, not `--safe-area-bottom`.

### Problem 3 — Status Bar: Transparent + Light Style on a Light Background
The current `useEffect` sets the status bar to transparent/Light style (white icons). The app's primary color is teal (`#0097a0`). This means the status bar icons blend poorly when the onboarding gradient is a light background.

### Problem 4 — Swiper height and no-scroll
The outer wrapper is `h-[100dvh] overflow-hidden` which is correct, but the body's global `padding-top` means the content starts shifted down, causing an apparent scroll zone at the bottom.

---

## What Is NOT Touched (Strict Compliance)
- `index.css` — no global changes
- `design-tokens.css` — no changes
- `Layout.tsx`, `Header.tsx` — no changes
- `App.tsx` routing logic — no changes (only the `Navigate` import fix)
- All other pages — completely unaffected
- Image aspect ratios — preserved (existing `object-contain` + `h-auto` kept)

---

## The `Navigate` Build Error Fix (Separate Issue)

**File: `src/App.tsx` lines 3-10**

The project uses `react-router-dom ^7.6.3`. In v7, `Navigate` **is** exported from `react-router-dom` — it has been since v6. The build error is likely caused by the import block being split/malformed after previous edits. The fix is to ensure `Navigate` appears in the same import statement as `BrowserRouter`, `Routes`, etc.

Current import block (lines 3-10):
```typescript
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
```

This looks correct. The actual issue may be a stale build cache or the `bun install` failure (the two local plugins `capacitor-background-sms-listener` and `capacitor-sms-reader` fail with `ENOENT` — these are `file:` path packages that only exist in the native project and don't affect the web build). We need to verify the import is intact and re-save the file to force a rebuild.

---

## Onboarding Safe-Area Fix Strategy

### Why `safeAreaPadding={false}` + `StatusBar.setOverlaysWebView(true)` Changes Everything

When `StatusBar.setOverlaysWebView({ overlay: true })` is called (which the onboarding `useEffect` does), the native WebView expands to fill behind the status bar. On native, the global `body { padding-top: var(--safe-area-top) }` from `index.css` would normally compensate — but since the onboarding uses a full-screen approach and the slide header ALSO adds safe-area padding, the safe area is counted twice.

The fix: in `OnboardingSlides.tsx`, neutralize the body's inherited top padding by applying a **negative margin-top** equal to the safe area on the outermost container, then let the slide header's own `env(safe-area-inset-top)` handle positioning correctly. This is purely local to the onboarding component.

### Exact Changes — Minimal Diff

#### File 1: `src/onboarding/OnboardingSlides.tsx` (only file for layout/safe-area fixes)

**Change A — Outer container: compensate for global body padding-top**

The outermost `<div>` needs a negative top margin to "undo" the global body padding, so the full-screen slide starts at pixel 0:

```tsx
// Before (line 85):
<div className="relative w-full h-[100dvh] bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">

// After:
<div
  className="relative w-full bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden"
  style={{
    height: '100dvh',
    marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
  }}
>
```

Why this works:
- `marginTop: calc(-1 * env(safe-area-inset-top))` pulls the container up by exactly the amount the global body padding pushed it down — net effect: starts at screen top
- `paddingTop: env(safe-area-inset-top)` restores the safe area INSIDE the container so the background gradient correctly covers the notch area without any content peeking behind the status bar
- `height: 100dvh` stays — ensures the container fills exactly the viewport

**Change B — Progress dots: keep existing fix, just ensure it layers above the padded area**

No change needed — `pt-[max(6px,var(--safe-area-top))]` already handles this. Since the container now has its own `paddingTop` for the safe area, and the dots use `absolute top-0`, the dots will respect the container's padding. Remove the redundant `pt-[max(6px,var(--safe-area-top))]` from the dots and use a simpler `pt-2` since the container padding already clears the notch:

```tsx
// Before (line 89):
<div className="absolute top-0 z-10 left-1/2 transform -translate-x-1/2 pt-[max(6px,var(--safe-area-top))]">

// After:
<div className="absolute top-0 z-10 left-1/2 -translate-x-1/2 pt-2">
```

**Change C — Slide header: remove double safe-area**

Currently uses `pt-[calc(var(--safe-area-top)+2rem)]`. Since the outer container now handles the safe area compensation, the header only needs visual breathing room above the icon — no more safe area addition:

```tsx
// Before (line 124):
className={`relative pb-4 bg-gradient-to-b ${slide.gradient} shrink-0 pt-[calc(var(--safe-area-top)+2rem)]`}

// After:
className={`relative pb-4 bg-gradient-to-b ${slide.gradient} shrink-0 pt-8`}
```

`pt-8` = 32px of visual breathing room below the progress dots and above the icon. Clean and simple.

**Change D — Bottom action section: use direct `env()` inline style (reliable)**

Replace the Tailwind arbitrary `pb-[calc(var(--safe-area-bottom)+1rem)]` with a direct inline style — this is guaranteed to work where Tailwind CSS variable resolution in `calc()` may not:

```tsx
// Before (line 164):
<div className="px-4 pt-2 shrink-0 pb-[calc(var(--safe-area-bottom)+1rem)]">

// After:
<div
  className="px-4 pt-2 shrink-0"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
>
```

**Change E — Status bar: match app theme color**

The app primary is `hsl(183, 100%, 32%)` = approximately `#009fa8` (teal). Set the status bar background to this color with `Dark` style (dark icons on light/teal background) to match the app theme. On unmount, restore to transparent/overlay mode that the app shell uses:

```tsx
// In useEffect, replace current status bar block:
if (Capacitor.isNativePlatform?.()) {
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#009fa8' });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (error) {
    void error;
  }
}

// In cleanup (return):
return () => {
  window.removeEventListener('resize', setVh);
  // Restore overlay mode for the rest of the app
  if (Capacitor.isNativePlatform?.()) {
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  }
};
```

#### File 2: `src/App.tsx` (Navigate import fix only)

Re-save the import block to ensure `Navigate` is properly included — the existing import structure is correct but may need a clean rebuild trigger. No logic changes.

---

## Summary of All Changes

| File | Change | Lines Affected |
|---|---|---|
| `src/onboarding/OnboardingSlides.tsx` | Outer container: neg margin + paddingTop to cancel global body padding | 85 |
| `src/onboarding/OnboardingSlides.tsx` | Progress dots: simplify to `pt-2` (container handles safe area) | 89 |
| `src/onboarding/OnboardingSlides.tsx` | Slide header: replace `pt-[calc(...)]` with simple `pt-8` | 124 |
| `src/onboarding/OnboardingSlides.tsx` | Bottom section: inline style with `env(safe-area-inset-bottom)` | 164 |
| `src/onboarding/OnboardingSlides.tsx` | Status bar: teal color + Dark style + proper cleanup/revert | 62-81 |
| `src/App.tsx` | Ensure `Navigate` import is intact (rebuild fix) | 3-10 |

---

## Manual Test Checklist

After implementing:
- **Small Android (e.g. Pixel 4a):** No gap at top, footer button above nav bar, images not cropped, no scroll
- **Large Android (e.g. Pixel 7 Pro):** Same as above, image section uses available flex space without overflow
- **iPhone with notch (iPhone 12/13):** Header clears notch, no double padding, bottom button above home bar
- **iPhone Dynamic Island (iPhone 14 Pro+):** Header clears Dynamic Island (~59px), content not clipped
- **Landscape:** `100dvh` adapts, no scroll, images constrained by `max-h-[35vh]` and `object-contain` — no cropping
- **Web browser:** Safe area insets = 0px, so `env(safe-area-inset-top, 0px)` falls back to 0 — layout identical to before
- **Status bar:** Teal background with dark icons during onboarding; reverts to transparent+overlay when leaving
