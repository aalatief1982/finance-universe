## Plan: Align Native Classifier with JS Filter + Dynamic Keywords

### Status: ✅ Implemented

### Summary
Aligned `FinancialSmsClassifier.java` (native Android) with `messageFilter.ts` (JS) to use the same triple-gate logic (keyword + amount + date), expanded keywords (27), fixed amount regex for Arabic-prefixed currency codes, added OTP exclusion, and added a keyword sync bridge from localStorage to SharedPreferences.

### Root Cause (Original Bug)
The SMS `بـSAR 4` failed the native amount regex because `\b` word boundaries don't work reliably with Arabic Tatweel (U+0640) directly preceding `SAR` on some Android regex engines.

### Changes Made

| File | Change |
|---|---|
| `src/utils/syncKeywordsToNative.ts` | **New** — reads `xpensia_type_keywords` from localStorage, flattens to string array, writes to Capacitor Preferences (`xpensia_native_financial_keywords`) |
| `FinancialSmsClassifier.java` | **Rewritten** — triple-gate (keyword+amount+date), reads dynamic keywords from SharedPreferences with fallback to 27 hardcoded, fixed amount regex (no `\b`), OTP exclusion, NFC normalization, `Log.d` diagnostics |
| `BackgroundSmsListenerPlugin.java` | Updated `handleIncomingSms` to pass `context` to classifier |
| `messageFilter.ts` | Added OTP exclusion keywords before financial gates |
| `initializeXpensiaStorageDefaults.ts` | Calls `syncKeywordsToNative()` after keyword initialization |
| `KeywordBankManager.tsx` | Calls `syncKeywordsToNative()` after save/delete |

### Architecture After Changes

```text
App startup / keyword edit
  → localStorage: xpensia_type_keywords
  → Preferences.set: xpensia_native_financial_keywords (sync bridge)
        ↓
  SharedPreferences (CapacitorStorage)
        ↓
SMS arrives → BroadcastReceiver
  → FinancialSmsClassifier.isFinancialTransactionMessage(context, body)
     0. OTP check → reject if OTP keywords found
     1. Load keywords from SharedPreferences (fallback: hardcoded 27)
     2. Gate 1: keyword match
     3. Gate 2: amount match (fixed regex, no \b)
     4. Gate 3: date match (ported from JS)
     → persist + notify
```

### OTP Keywords (shared between Java & JS)
`otp`, `verification code`, `رمز التحقق`, `رمز التفعيل`, `one-time`, `one time password`, `passcode`, `pin code`, `security code`, `auth code`, `كلمة المرور`, `رمز التأكيد`

### What Was NOT Changed
- SMS persistence, notification channel, intent routing
- Template bank, keyword bank, vendor map logic
- Freeform parser
- No new permissions required
