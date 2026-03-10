

## Plan: Align Native Classifier with JS Filter + Dynamic Keywords from Storage

### Context: Why Two Files Exist

| | `FinancialSmsClassifier.java` (Native) | `messageFilter.ts` (JavaScript) |
|---|---|---|
| **Runs when** | SMS arrives — real-time, even when app is killed. Runs in `BroadcastReceiver` (pure Java, no WebView). | User opens app — Import Service, Smart Entry, Bulk Import. Runs in WebView. |
| **Can access** | `SharedPreferences` only | `localStorage` (WebView) |
| **Current gates** | 2 (keyword + amount) | 3 (keyword + amount + date) |
| **Keywords** | 15 hardcoded | 27 fallback + user-customizable via `xpensia_type_keywords` in localStorage |

### The Storage Bridge Problem

`localStorage` lives inside the WebView — native Java cannot read it. To give the native classifier access to user-customized keywords, we need a **sync bridge**: when the app initializes or keywords change, write them to `SharedPreferences` (which Capacitor Preferences already uses under group `CapacitorStorage`), so the Java classifier can read them.

### Changes

#### 1. New JS utility: `syncKeywordsToNative()` (`src/utils/syncKeywordsToNative.ts`)
- Reads `xpensia_type_keywords` from localStorage
- Flattens the object/array into a simple JSON string array of keywords
- Writes to Capacitor `Preferences.set({ key: 'xpensia_native_financial_keywords', value: JSON.stringify(flatList) })`
- Called from `initializeXpensiaStorageDefaults.ts` on app startup
- Called from `KeywordBankManager.tsx` on save/delete

#### 2. Update `FinancialSmsClassifier.java`
- Accept a `Context` parameter in `isFinancialTransactionMessage(Context, String)`
- Read `SharedPreferences` group `CapacitorStorage`, key `xpensia_native_financial_keywords`
- Parse the JSON string array into a keyword list
- Fall back to the hardcoded keyword list (expanded to match the 27 JS fallback keywords) if SharedPreferences is empty or parsing fails
- Add NFC normalization (`java.text.Normalizer`)
- Fix amount regex: replace `\b` boundaries with `(?:^|[^\\p{L}\\w])` to handle Arabic-prefixed currency codes like `بـSAR`
- Add date gate (port JS date regex) — upgrade to triple-gate
- Add OTP exclusion keywords — reject before financial gates
- Add `Log.d` diagnostics

#### 3. Update `SmsBroadcastReceiver.java` and `BackgroundSmsListenerPlugin.java`
- Pass `context` to the updated classifier method signature

#### 4. Update `messageFilter.ts`
- Add OTP exclusion keywords — same list as Java, reject before financial gates

#### 5. Update `initializeXpensiaStorageDefaults.ts`
- Call `syncKeywordsToNative()` after writing `xpensia_type_keywords`

#### 6. Update `KeywordBankManager.tsx`
- Call `syncKeywordsToNative()` after `saveKeywordBank()` and `deleteKeyword()`

### Flow After Changes

```text
App startup / keyword edit
  → localStorage: xpensia_type_keywords (existing)
  → Preferences.set: xpensia_native_financial_keywords (new sync)
        ↓
  SharedPreferences (CapacitorStorage)
        ↓
SMS arrives → BroadcastReceiver
  → FinancialSmsClassifier.isFinancialTransactionMessage(context, body)
     1. OTP check → reject if OTP keywords found
     2. Read keywords from SharedPreferences (fallback: hardcoded 27)
     3. Gate 1: keyword match
     4. Gate 2: amount match (fixed regex)
     5. Gate 3: date match (new)
     → persist + notify
```

### Files Changed

| File | Change |
|---|---|
| `src/utils/syncKeywordsToNative.ts` | New — reads localStorage keywords, writes to Capacitor Preferences |
| `src/lib/smart-paste-engine/initializeXpensiaStorageDefaults.ts` | Call `syncKeywordsToNative()` after keyword init |
| `src/pages/KeywordBankManager.tsx` | Call `syncKeywordsToNative()` after save/delete |
| `FinancialSmsClassifier.java` | Accept Context, read SharedPreferences keywords with fallback, expand hardcoded to 27, fix amount regex, add date gate, add OTP exclusion, add NFC normalization, add logging |
| `SmsBroadcastReceiver.java` | Pass `context` to classifier |
| `BackgroundSmsListenerPlugin.java` | Pass `context` to classifier |
| `messageFilter.ts` | Add OTP exclusion keywords |

### What Is NOT Changed
- SMS persistence, notification channel, intent routing
- Template bank, keyword bank, vendor map logic
- Freeform parser
- No new permissions required

