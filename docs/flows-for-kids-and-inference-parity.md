# Xpensia Flows — For Kids & Inference Parity Proof

---

## PART 1 — The Robot Helper Story 🤖

Imagine you have a robot helper called **Xpensia**. Its job is to remember every time you spend or receive money, so you don't have to write it all down yourself!

### Flow 1: Smart Entry — "You Tell the Robot"

1. You open the app and tap **"Smart Entry"**.
2. You copy a message from your phone — like one from your bank that says *"You paid 50 riyals at the grocery store."*
3. You paste it into a box, like putting a letter in a mailbox.
4. The robot reads the letter super fast and figures out:
   - **How much?** → 50
   - **Where?** → Grocery store
   - **When?** → Today
   - **Spending or earning?** → Spending
5. The robot shows you what it found and says *"Does this look right?"*
6. You say yes, and it saves it in your piggy bank book!

### Flow 2: SMS Listening — "The Robot Has Super Hearing"

1. While you're playing or doing anything on your phone, a new bank message arrives.
2. The robot's ears perk up! 👂 It hears the message automatically.
3. First it asks itself: *"Is this about money?"* If it's just a "Happy Birthday" text, the robot ignores it.
4. If it IS about money, the robot reads it the same way as before (same brain!) and figures out all the details.
5. If you're using the app right now, it pops up and says *"Hey, I found a new purchase! Check it out!"*
6. If you're NOT using the app, it sends you a little tap on the shoulder (a notification). When you tap it, you see the purchase ready to review.

### Flow 3: Bulk Import — "The Robot Digs Through Old Messages"

1. You tap **"Import SMS"** and the robot asks permission to look at your old messages.
2. It goes through messages from the last month (about 30 days back).
3. For each message, it asks itself *"Is this about money?"* — just like the listening robot.
4. It collects all the money messages and reads each one with the **same brain** it always uses.
5. You see a list of all the purchases it found, with little colored dots:
   - 🟢 Green = "I'm very sure about this one!"
   - 🟡 Yellow = "I think this is right, but check it please."
   - 🔴 Red = "I'm not sure, help me out."
6. You can fix anything that looks wrong, skip messages you don't care about, and save them all at once!

---

## PART 2 — Flow Map (Routes & Screens)

### Flow 1: Smart Entry

| Step | Route | Component | What happens |
|------|-------|-----------|--------------|
| 1. Entry | `/import-transactions` | `ImportTransactions.tsx` | Page with SmartPaste text box |
| 2. Paste & Parse | (same page) | `SmartPaste.tsx` | User pastes SMS, calls `parseAndInferTransaction()` |
| 3. Review fields | (same page) | `SmartPaste.tsx` | Shows parsed fields with confidence colors |
| 4. Confirm | → `/edit-transaction` | `EditTransaction.tsx` | Full form with `normalizeInferenceDTO` state |

### Flow 2: SMS Listening (Real-time)

| Step | Route | Component | What happens |
|------|-------|-----------|--------------|
| 1. SMS arrives | (background) | `App.tsx` → `smsReceived` listener | `BackgroundSmsListener` fires event |
| 2. Financial filter | (background) | `App.tsx` | `isFinancialTransactionMessage(body)` check |
| 3. Parse | (background) | `App.tsx` | Calls `buildInferenceDTO()` → internally calls `parseAndInferTransaction()` + `normalizeInferenceDTO()` |
| 4a. App active | → `/edit-transaction` | `EditTransaction.tsx` | Direct navigation with DTO state |
| 4b. App background | (notification) | `App.tsx` | Schedules local notification with raw SMS data |
| 5. Notification tap | → `/edit-transaction` | `App.tsx` | Re-parses via `buildInferenceDTO()`, navigates |

### Flow 3: Bulk Import

| Step | Route | Component | What happens |
|------|-------|-----------|--------------|
| 1. Entry | `/process-sms` | `ProcessSmsMessages.tsx` | Reads SMS history, filters financial messages |
| 2. Vendor mapping | `/vendor-mapping` | `VendorMapping.tsx` | User maps vendor names to categories |
| 3. Review all | `/review-sms-transactions` | `ReviewSmsTransactions.tsx` | Parses each SMS via `parseAndInferTransaction()`, normalizes via `normalizeInferenceDTO()` |
| 4. Edit one (optional) | → `/edit-transaction` | `EditTransaction.tsx` | "Full Form" button sends `normalizeInferenceDTO` state |
| 5. Bulk save | (same review page) | `ReviewSmsTransactions.tsx` | Saves all via `saveTransactionWithLearning()` |

---

## PART 3 — Inference Intersection Proof

### Entrypoint Trace Table

| Flow | Entry file + function | Parser used | Normalizer used | Output to `/edit-transaction` |
|------|----------------------|-------------|-----------------|-------------------------------|
| **Smart Entry** | `SmartPaste.tsx` → `handleSubmit` → `ImportTransactions.tsx` → `handleTransactionsDetected` | `parseAndInferTransaction()` ✅ | `normalizeInferenceDTO()` ✅ | Full `InferenceDTO` with `mode:'create'`, `origin`, `matchOrigin`, confidence metadata |
| **SMS Listening (foreground)** | `App.tsx` → `smsReceived` listener | `buildInferenceDTO()` → `parseAndInferTransaction()` ✅ | `buildInferenceDTO()` → `normalizeInferenceDTO()` ✅ | Full `InferenceDTO` |
| **SMS Listening (notification tap)** | `App.tsx` → `localNotificationActionPerformed` | `buildInferenceDTO()` → `parseAndInferTransaction()` ✅ | `buildInferenceDTO()` → `normalizeInferenceDTO()` ✅ | Full `InferenceDTO` |
| **Bulk Import (review)** | `ReviewSmsTransactions.tsx` → `parseAll` in `useEffect` | `parseAndInferTransaction()` ✅ | `normalizeInferenceDTO()` ✅ | Full `InferenceDTO` stored as `txn.inferenceDTO` |
| **Bulk Import (Full Form button)** | `ReviewSmsTransactions.tsx` → Full Form `onClick` | No re-parse (reuses prior result) | Re-normalizes from existing `txn.inferenceDTO` | `InferenceDTO` with spread of prior DTO |
| **NER Smart Entry** ⚠️ | `NERSmartPaste.tsx` → `handleSubmit` → `ImportTransactionsNER.tsx` → `handleTransactionsDetected` | `parseAndInferTransaction()` ✅ (+ unused `extractTransactionEntities()` call) | `normalizeInferenceDTO()` ✅ | Full `InferenceDTO` |

### Verification Questions

**Q1: Do all flows call `parseAndInferTransaction` (directly or through `buildInferenceDTO`)?**

> ✅ **YES.** All 3 main flows (Smart Entry, SMS Listening, Bulk Import) use `parseAndInferTransaction` as their core parser. The SMS Listening flow wraps it inside `buildInferenceDTO()`, which internally calls `parseAndInferTransaction()`.
>
> ⚠️ Minor note: `NERSmartPaste.tsx` also calls `extractTransactionEntities(text)` on line 83, but its result is unused — the actual transaction comes from `parseAndInferTransaction()` on line 88. This is dead code, not drift.

**Q2: Do all flows use `normalizeInferenceDTO`?**

> ✅ **YES.** Every flow that navigates to `/edit-transaction` passes through `normalizeInferenceDTO()`:
> - Smart Entry: in `ImportTransactions.tsx` line 105
> - SMS Listening: inside `buildInferenceDTO.ts` line 20
> - Bulk Import: in `ReviewSmsTransactions.tsx` line 178
> - NER path: in `ImportTransactionsNER.tsx` line 74

**Q3: Are there any drift spots?**

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `NERSmartPaste.tsx:83` | Calls `extractTransactionEntities()` whose result is unused (dead code) | Low — no functional impact |
| 2 | `NERSmartPaste.tsx:100` | Does NOT pass `fieldConfidences` in the `onTransactionsDetected` callback (10th arg missing) | Medium — field confidence colors won't render in edit form |
| 3 | `ReviewSmsTransactions.tsx` Full Form button | Re-normalizes from existing `txn.inferenceDTO` via spread; `origin`/`matchOrigin` are implicitly carried forward rather than explicitly set | Low — works but fragile |

---

## PART 4 — Final Conclusion

### 🟢 Inference is UNIFIED

All three primary flows (Smart Entry, SMS Listening, Bulk Import) converge on the **same two functions**:

```
parseAndInferTransaction()  →  normalizeInferenceDTO()
```

The inference rules for **amount, date, vendor, type, category, subcategory, and account** are all computed in `parseAndInferTransaction.ts` using the same pipeline:
1. `parseSmsMessage()` — template matching + regex field extraction
2. `loadKeywordBank()` — keyword-based category/vendor inference
3. `getFieldConfidence()` + `getTemplateConfidence()` + `getKeywordConfidence()` → `computeOverallConfidence()`

### Remaining minor risks (non-breaking):

1. **Dead code in NER path** — `extractTransactionEntities()` is called but unused; should be removed for clarity.
2. **Missing `fieldConfidences` in NER callback** — the NER SmartPaste component doesn't forward field confidences to the parent page.
3. **Implicit origin carry-forward** — the Bulk Import "Full Form" button relies on spread order to preserve `origin`/`matchOrigin` rather than setting them explicitly.

None of these risks break the core inference pipeline. All transactions are parsed by the same brain. 🧠
