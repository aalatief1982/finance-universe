

## Plan: Increase header icons 25% and fix sheet safe area

### Change 1: Icon size increase
**Files:** `src/components/header/Header.tsx`, `src/components/header/MobileNavigation.tsx`

- Mail icon: `size={39}` → `size={49}`
- Menu icon: `size={39}` → `size={49}`
- Touch targets (`h-11 w-11`) stay unchanged.

### Change 2: Sheet starts below status bar
**File:** `src/components/ui/sheet.tsx`

- For the `left` side variant, replace `inset-y-0` with `top-[var(--safe-area-top)] bottom-0` so the sheet panel starts below the device status bar instead of overlapping it.
- The overlay remains full-screen.

