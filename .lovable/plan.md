

# Fix Build Errors

Two errors are blocking the build and preventing updates from going live.

---

## Error 1: Local Capacitor Plugin Install Failure

`package.json` has two local `file:` dependencies that can't be resolved in the cloud:
- `capacitor-background-sms-listener`
- `capacitor-sms-reader`

These are only needed for native Android builds. The web app uses its own TypeScript wrappers (`Capacitor.registerPlugin()`) and never imports from these npm packages directly.

**Fix:** Remove both entries from `package.json` dependencies.

---

## Error 2: react-dnd TypeScript Error

`@types/react-dnd` uses a deprecated `module` keyword. The root `tsconfig.json` has `skipLibCheck: true` but `tsconfig.app.json` (used by Vite) does not.

**Fix:** Add `"skipLibCheck": true` to `tsconfig.app.json` compilerOptions.

---

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Remove 2 local `file:` plugin dependencies |
| `tsconfig.app.json` | Add `skipLibCheck: true` |

## Impact

- No effect on the Android/native build (Gradle handles those plugins separately)
- No effect on app functionality (the plugins are accessed via Capacitor's registerPlugin API, not npm imports)
- Once fixed, the build will succeed and all pending code changes will go live immediately

