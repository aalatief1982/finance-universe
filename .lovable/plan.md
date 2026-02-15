

# Admin-Only Visibility for Template Stats and OTA Debug Sections

## The Challenge

Your app currently runs without a backend authentication system (no Supabase auth). This means there is no server-side way to verify "who is the admin." We need a practical, lightweight approach that balances security with your current architecture.

## Recommended Approach: Secret Gesture + Encrypted localStorage Flag

Since these sections only display **read-only diagnostic info** (not sensitive user data or destructive actions), a client-side admin mode is acceptable here. The risk is low -- worst case, someone sees template stats or OTA bundle info.

### How It Works

1. **Hidden activation gesture**: Tap the version number at the bottom of Settings **5 times quickly** (like Android's "Developer Options").
2. **PIN prompt**: After the 5 taps, a dialog asks for a 4-6 digit PIN that only you know.
3. **Persistent flag**: On correct PIN, a hashed value is stored in localStorage so you don't need to re-enter it every session.
4. **Sections hidden by default**: `TemplateStatsSection` and `OTADebugSection` only render when admin mode is active.
5. **Deactivate option**: A small "Exit Admin Mode" button appears when active, clearing the flag.

### Why This Over Other Options

| Option | Pros | Cons |
|--------|------|------|
| **Secret gesture + PIN (recommended)** | No backend needed, invisible to users, quick to implement | Client-side only (acceptable for diagnostic data) |
| Supabase auth + roles table | Proper security, server-validated | Requires full auth setup -- overkill for hiding diagnostic panels |
| Environment variable | Simple | Can't toggle per-device, requires rebuild |
| URL parameter | Very simple | Easily discoverable, no persistence |

## Technical Details

### 1. Create admin utility (`src/utils/admin-utils.ts`)

- `ADMIN_PIN_HASH`: A SHA-256 hash of your chosen PIN, stored as a constant (not the plain PIN)
- `isAdminMode()`: Checks localStorage for `xpensia_admin_mode` with the correct hash
- `activateAdminMode(pin: string)`: Hashes the input, compares to `ADMIN_PIN_HASH`, sets localStorage if match
- `deactivateAdminMode()`: Clears the localStorage key
- Uses the existing `crypto-js` dependency for SHA-256 hashing

### 2. Modify `src/pages/Settings.tsx`

- Add state: `adminMode` (boolean), `tapCount` (number), `lastTapTime` (number), `showPinDialog` (boolean)
- On the **version text** section (line 955-961): attach an `onClick` handler that counts rapid taps (within 500ms). After 5 taps, open the PIN dialog.
- Wrap `TemplateStatsSection` and `OTADebugSection` in `{adminMode && <TemplateStatsSection />}` and `{adminMode && <OTADebugSection />}`
- When admin mode is active, show a subtle "Admin Mode" badge near the version and an "Exit" button

### 3. PIN Dialog

- Simple dialog with a numeric input field
- On submit, call `activateAdminMode(pin)` -- if it returns true, set `adminMode = true`
- Wrong PIN shows a toast error, dialog stays open

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/utils/admin-utils.ts` | **Create** -- admin mode check, activate, deactivate with hashed PIN |
| `src/pages/Settings.tsx` | **Modify** -- add tap-to-unlock on version, conditionally render admin sections, add PIN dialog |

