

## Plan: Add Temporary Debug Toasts to Android Share Sheet Flow

All toasts will be prefixed with `[DBG-SHARE]` so they're easy to find and remove later.

### Key Observations from Code Analysis

The share flow has these stages where things could silently fail:
1. **Native layer** (Java) stores text in SharedPreferences — we can't toast here, but we can toast when JS tries to consume it
2. **JS cold-start** `consumePendingSharedText()` — async call that may return empty
3. **JS warm-start** `appStateChange` listener — re-checks for shared text on resume
4. **`persistAndRouteSharedText`** — deduplication, storage, navigation decision
5. **Startup SMS flow** — may override navigation (has priority check)
6. **`SMS_AUTO_IMPORT_ENABLED`** is `false` — the `ImportDisabledGuard` blocks IMPORT_ROUTES but `/import-transactions` is NOT in that set, so this shouldn't block. Confirmed: the guard only blocks `/process-sms`, `/sms-providers`, etc.
7. **ImportTransactions page** `hydratePendingSharedText` — reads from localStorage and sets prefill
8. **SmartPaste** `prefillText` effect — puts text into textarea

### Toast Locations (all in `src/App.tsx` unless noted)

**Toast 1 — Share coordinator bootstrap** (~line 300)
When the share `useEffect` starts. Shows platform check result.
```
[DBG-SHARE] 1: Share coordinator started (platform=android)
```

**Toast 2 — `consumePendingSharedText` result** (~line 304-310)
After the native plugin call resolves. Shows whether text was found.
```
[DBG-SHARE] 2: consumePending result: text=[first 30 chars] | empty=[true/false]
```

**Toast 3 — `consumePendingSharedText` error** (~line 308-310)
If the native call throws.
```
[DBG-SHARE] 3: consumePending ERROR: [error message]
```

**Toast 4 — `persistAndRouteSharedText` entry** (~line 236)
When the function is called with a payload.
```
[DBG-SHARE] 4: persistAndRoute called | intake=[source] | textLen=[n] | empty=[true/false]
```

**Toast 5 — Dedupe skip** (~line 247-249)
When dedupe filter blocks the payload.
```
[DBG-SHARE] 5: SKIPPED by dedupe
```

**Toast 6 — Duplicate pending skip** (~line 252-259)
When existing pending text matches.
```
[DBG-SHARE] 6: SKIPPED duplicate pending
```

**Toast 7 — Save result & navigation decision** (~line 282-295)
After `savePendingSharedText` — shows whether navigation will happen.
```
[DBG-SHARE] 7: saved=[true/false] | navigate=[true/false] | from=[path] | to=/import-transactions
```

**Toast 8 — App resume share check** (~line 552-566)
When `appStateChange` fires and checks for shared text.
```
[DBG-SHARE] 8: Resume check | text=[first 30 chars] | empty=[true/false] | stored=[true/false] | willNavigate=[true/false]
```

**Toast 9 — Resume share error** (~line 568-570)
```
[DBG-SHARE] 9: Resume ERROR: [error message]
```

**Toast 10 — Startup SMS flow share priority check** (~line 728-733)
When the startup SMS flow checks for pending shared text.
```
[DBG-SHARE] 10: SMS flow priority check | hasPendingShare=[true/false]
```

**Toast 11 — In `src/pages/ImportTransactions.tsx` (~line 75-87)**
When the page hydrates pending shared text.
```
[DBG-SHARE] 11: ImportPage hydrate | found=[true/false] | textLen=[n]
```

**Toast 12 — In `src/components/SmartPaste.tsx` (~line 115-137)**
When prefillText is received and applied (or blocked).
```
[DBG-SHARE] 12: SmartPaste prefill | applied=[true/false] | blocked=[true/false] | textLen=[n]
```

**Toast 13 — `sharedTextReceived` listener** (~line 312-314)
When the native event listener fires (warm start).
```
[DBG-SHARE] 13: sharedTextReceived event | textLen=[n] | source=[source]
```

### Files to Change
- `src/App.tsx` — Toasts 1-10, 13
- `src/pages/ImportTransactions.tsx` — Toast 11
- `src/components/SmartPaste.tsx` — Toast 12

All toasts use `toast({ title: '[DBG-SHARE] ...', duration: 8000 })`. Each is marked with a comment `// [REMOVABLE-DEBUG-TOAST]` for easy cleanup later.

