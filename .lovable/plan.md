
# Fix: Status Bar Not Showing Teal (#0097A0) in Light Mode

## Problem

The status bar appears in a light/white color across the splash screen, onboarding, and all app pages when in light mode. Dark mode works correctly.

Two separate layers are responsible:

### Layer 1: Native Android Splash Screen

**Files:** `android/app/src/main/res/values-v23/styles.xml` and `android/app/src/main/res/values/styles.xml`

During the native splash screen (before the WebView loads), Android uses the theme defined in these XML files. The light-mode variant sets:

```xml
<item name="android:statusBarColor">@android:color/white</item>
```

This makes the status bar white during the splash. The dark-mode variant (`values-night-v23`) uses black, which is why dark mode looks fine.

### Layer 2: Capacitor JavaScript (After WebView Loads)

**File:** `src/App.tsx` lines 126-128

Once the app loads, the JavaScript status bar logic sets theme-aware colors instead of the requested teal:

```tsx
const statusBarBackgroundColor = onboarding
  ? (darkMode ? '#06263b' : '#e8f7f8')   // light mode = pale teal
  : (darkMode ? '#020817' : '#f8fafc');   // light mode = near white
```

Both light-mode values are essentially white/very pale, not the requested `#0097a0`.

---

## Fix Plan

### Change 1: `src/App.tsx` (lines 126-128)

Replace the theme-aware colors with the requested teal for light mode:

```
Before:
  const statusBarBackgroundColor = onboarding
    ? (darkMode ? '#06263b' : '#e8f7f8')
    : (darkMode ? '#020817' : '#f8fafc');

After:
  const statusBarBackgroundColor = onboarding
    ? (darkMode ? '#06263b' : '#0097a0')
    : (darkMode ? '#020817' : '#0097a0');
```

Both onboarding and default pages will show teal `#0097a0` in light mode. Dark mode colors remain unchanged.

The `Style.Dark` (dark icons) is already correctly applied for light mode on line 132 — dark icons on teal background has good contrast.

### Change 2: `android/app/src/main/res/values-v23/styles.xml`

Change the native splash status bar color from white to teal so the splash screen also shows the correct color before JavaScript runs:

```
Before:
  <item name="android:statusBarColor">@android:color/white</item>
  (appears in both AppTheme.NoActionBar and AppTheme.NoActionBarLaunch)

After:
  <item name="android:statusBarColor">#FF0097A0</item>
  (both styles)
```

Note: Android XML requires `#AARRGGBB` format, so `#FF0097A0` is fully opaque teal.

Also update `windowLightStatusBar` to `false` since we want light/white icons on the teal background during splash:

```
Before:
  <item name="android:windowLightStatusBar">true</item>

After:
  <item name="android:windowLightStatusBar">false</item>
```

Wait -- actually the JS code uses `Style.Dark` for light mode (line 132), which means **dark icons** on the status bar. For consistency between the native splash and JS:
- If `Style.Dark` = dark icons: `windowLightStatusBar` should be `true` (Android's naming is inverted -- `true` means dark icons)
- So keep `windowLightStatusBar` as `true` -- just change the background color

Corrected change for `values-v23/styles.xml`:

```xml
<!-- Both styles: only change statusBarColor, keep windowLightStatusBar=true -->
<item name="android:statusBarColor">#FF0097A0</item>
<item name="android:windowLightStatusBar">true</item>
```

### Change 3: `android/app/src/main/res/values/styles.xml` (base theme)

For pre-API-23 devices, update the fallback status bar color in both `AppTheme.NoActionBar` and `AppTheme.NoActionBarLaunch`:

```
Before:
  <item name="android:statusBarColor">@android:color/black</item>

After:
  <item name="android:statusBarColor">#FF0097A0</item>
```

---

## Build Error Note

The current build error (`ENOENT: failed opening cache/package/version dir for package capacitor-background-sms-listener`) is a `bun install` cache issue with local file-path packages (`file:capacitor-background-sms-listener` and `file:./capacitor-sms-reader`). This is unrelated to the status bar changes and is a pre-existing infrastructure issue. The status bar fixes are pure color value changes and will not affect this.

---

## Summary

| File | Change | Scope |
|---|---|---|
| `src/App.tsx` line 127-128 | Light mode colors from `#e8f7f8`/`#f8fafc` to `#0097a0` | All pages after WebView loads |
| `android/app/src/main/res/values-v23/styles.xml` | `statusBarColor` from `@android:color/white` to `#FF0097A0` | Native splash + app theme (API 23+) |
| `android/app/src/main/res/values/styles.xml` | `statusBarColor` from `@android:color/black` to `#FF0097A0` | Fallback for pre-API-23 |

## What Is NOT Changed
- Dark mode colors -- remain as-is (working correctly)
- `values-night-v23/styles.xml` -- dark mode native theme untouched
- `OnboardingSlides.tsx` -- no changes needed
- `Layout.tsx`, `index.css` -- untouched
- No global CSS changes

## Test Checklist
- Splash screen: status bar is teal with dark icons in light mode
- Onboarding slides: status bar stays teal in light mode
- Home/other pages: status bar stays teal in light mode
- Dark mode: all screens unchanged (dark status bar as before)
