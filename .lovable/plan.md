

# Xpensia SMS Detection & Parsing Knowledge Inventory

## 1. Executive Summary

The codebase has **5 runtime layers** for text recognition: Native Android classifier, JS message filter, structure/template parser, suggestion/inference engine, and freeform fallback parser. There are **18 distinct localStorage keys** involved in detection, parsing, or learning. The system maintains **separate keyword/regex datasets** at native and JS levels with partial overlap, plus a large vendor registry (~8000 entries) seeded from a JSON file. Freeform parsing is fully isolated from SMS learning via separate storage keys.

---

## 2. Runtime Layer Map

```text
Layer 1: Native Android (FinancialSmsClassifier.java)
  → double-gate: keyword + amount
  → fires for real-time SMS notifications

Layer 2: JS Filter (messageFilter.ts)
  → triple-gate: keyword + amount + date
  → used by Import Service and Smart Entry pre-check

Layer 3: Structure/Template Parser (templateUtils.ts, structureParser.ts)
  → template extraction: amount+currency, date, account, vendor
  → template matching by sender-scoped hash

Layer 4: Suggestion/Inference Engine (suggestionEngine.ts)
  → keyword bank lookup, type keyword inference
  → vendor fallback matching (fuzzy + substring)
  → confidence graph overlay

Layer 5: Freeform Fallback (freeformParser.ts)
  → verb/keyword based intent detection
  → isolated from layers 1-4 learning
```

---

## 3. Inventory by Category

### A. Native Financial SMS Classifier

| Item | File | Function/Variable | Hardcoded/Dynamic | Active | Purpose |
|---|---|---|---|---|---|
| `FINANCIAL_KEYWORDS` | `FinancialSmsClassifier.java:6-9` | static String[] | Hardcoded | Active | Double-gate keyword check |
| `AMOUNT_PATTERN` | `FinancialSmsClassifier.java:13-15` | static Pattern | Hardcoded | Active | Double-gate amount check |

**Exact Keywords (15):**
```
AR: "مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع"
EN: "transaction", "purchase", "debit", "credit", "withdraw", "deposit", "payment"
```

**Exact Amount Regex:**
```regex
(?i)(?:\b(?:sar|usd|egp|aed|bhd|eur|gbp|jpy|inr|cny|cad|aud)\b\s*\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?|\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?\s*\b(?:sar|usd|egp|aed|bhd|eur|gbp|jpy|inr|cny|cad|aud)\b|\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?\s*(?:ر\.?\s?س|ريال|جنيه))
```
**Native currency codes (12):** SAR, USD, EGP, AED, BHD, EUR, GBP, JPY, INR, CNY, CAD, AUD
**Native Arabic currency tokens (3):** `ر.س`, `ريال`, `جنيه`

---

### B. JS Financial Filter (messageFilter.ts)

**Fallback Keywords (31):**
```
AR: "مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع",
    "عملية", "مشتريات", "سحب", "استلام", "رسوم", "الرسوم", "خصم",
    "الرصيد", "مدفوعات"
EN: "transaction", "purchase", "debit", "debited", "credit", "credited",
    "withdrawal", "withdraw", "deposit", "deposited", "payment", "paid",
    "transfer", "transferred", "remittance", "charged", "balance", "fee", "fees"
```
Stored keywords override these via `xpensia_type_keywords` (when present as flat array).

**Amount+Currency Regex (messageFilter.ts:76):**
```regex
(?:مبلغ[:\s]*)?(?:(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه)[\s:]?((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)|((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)[\s:]?(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه))
```

**Date Regex (messageFilter.ts:79-94):**
Assembled from 8 branches:
```
\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{1,4}
\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}
\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4}
\d{1,2}\s+(?:Jan|Feb|...)...\s+\d{4}
(?:Jan|Feb|...)...\s+\d{1,2},?\s+\d{4}
\d{2}[\s-]?(?:Jan|Feb|...)...[\s-]?\d{2,4}   (compact: 09MAR26)
\d{2}[01]\d{3}
\d{8}
```
Prefixed with optional `(?:في[:\s]*)?(?:on\s*)?`
Suffixed with optional time `(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?`

**Normalization in messageFilter.ts:**
```ts
str.normalize('NFC').replace(/\s+/g, '').trim().toLowerCase()
```

---

### C. OTP Exclusion (ProcessSmsMessages.tsx:223-228)

**Exact OTP keyword list (16):**
```
EN: 'otp', 'code', 'password', 'passcode', 'one time', 'verification', 'auth',
    'login code', 'do not share', 'use this code', 'security code'
AR: 'رمز', 'رمز الدخول', 'رمز التحقق', 'رمز الأمان', 'كلمة مرور'
```
Applied via `lower.includes(kw)` check. Only in ProcessSmsMessages, NOT in messageFilter or native classifier.

---

### D. Template Parser Regexes (templateUtils.ts:319-346)

**Amount+Currency Regex (same as messageFilter):**
```regex
(?:مبلغ[:\s]*)?(?:(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه)[\s:]?...
```

**Date Regex (6 branches, same base patterns as messageFilter minus compact bank-style):**
```
\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{1,4}
\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}
\d{1,2}-(Jan|Feb|...)-\d{2,4}
\d{1,2}\s+(?:Jan|Feb|...)...\s+\d{4}
(?:Jan|Feb|...)...\s+\d{1,2},?\s+\d{4}
\d{2}[01]\d{3}
\d{8}
```
Note: Missing the compact `\d{2}[\s-]?(?:Jan|...)[\s-]?\d{2,4}` branch that messageFilter has.

**Account Regex:** `\*{2,4}\d{3,4}`

**smsParser.ts (legacy):**
- Amount: `(\d+[.,]\d{2})|\d+`
- Date: `\d{4}-\d{2}-\d{2}`

---

### E. Vendor Extraction (suggestionEngine.ts:640-697)

**Normalization before extraction:**
```ts
message.normalize('NFC').replace(/[\u200B-\u200D\uFEFF\u061C]/g, '')
```

**Explicit label pattern:**
```regex
/(?:^|[\s\n])(?:لدى|merchant|vendor)\s*[:：]\s*([^\n,؛;]+)/i
```

**Anchor patterns (2):**
```regex
/(?:^|[\s\n])(?:من\s+عند|تم\s+الدفع\s+لـ|تم\s+الشراء\s+من|لدى|من|عند)\s*[:\s]\s*([^\n]+?)(?=\s+(?:بمبلغ|بقيمة|مبلغ|بسعر|في|تاريخ|الرسوم)(?:\s|$)|[\n,،؛;:.!؟?-]|$)/i
/(?:\b)(?:at|from|paid to|purchased from)\s*[:\s]*([^\n,؛;:-]+)/i
```

**Domain-like fallback:** `/(?:^|[\s\n:،؛;,])([a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?=$|[\s\n،؛;,])/i`

**Salary fallback keywords:** `'راتب'`, `'salary'` → returns `'Company'`

**Vendor validation rejects:**
- length <= 2
- numeric-only
- 4-digit numbers
- contains 'sar'
- starts with `**`
- pure decimal number

---

### F. Currency Data

**`CURRENCY_NAME_TO_CODE` (currency-utils.ts:26-59):**
```
AR: جنيه→EGP, جنيه مصري→EGP, جنيه مصرى→EGP, ريال→SAR, ر.س→SAR, ر. س→SAR,
    ر س→SAR, درهم→AED, دولار→USD, يورو→EUR, دينار→KWD, دينار كويتي→KWD,
    دينار بحريني→BHD, دينار اردني→JOD, ليرة→LBP, ليرة لبنانية→LBP
EN: dollar→USD, dollars→USD, pound→GBP, pounds→GBP, euro→EUR, euros→EUR,
    yen→JPY, rupee→INR, rupees→INR, riyal→SAR, riyals→SAR, dirham→AED, dirhams→AED
```

**`VALID_CURRENCY_CODES` set (62 codes):** USD EUR GBP JPY CAD AUD CHF CNY INR NZD EGP SAR AED BHD KWD OMR QAR JOD LBP IQD SYP YER TND DZD MAD LYD SDG ZAR PKR BDT LKR NPR THB MYR SGD IDR PHP VND KRW TWD HKD SEK NOK DKK PLN CZK HUF RON BGN HRK RUB TRY UAH MXN BRL ARS CLP COP PEN

**Freeform `CURRENCY_MAP` (freeformParser.ts:55-63):**
```
sar→SAR, riyal→SAR, riyals→SAR, ريال→SAR, ريالات→SAR,
usd→USD, dollar→USD, dollars→USD, دولار→USD,
aed→AED, dirham→AED, dirhams→AED, درهم→AED,
egp→EGP, جنيه→EGP, pound→EGP, pounds→EGP,
eur→EUR, euro→EUR, euros→EUR, يورو→EUR,
gbp→GBP, kwd→KWD, bhd→BHD, qar→QAR, omr→OMR,
jod→JOD, دينار→KWD
```

---

### G. Account Inference Regexes

**accountCandidates.ts:**
```
ANCHOR_PATTERN: /\b(card|acct|account|a\/c|iban|wallet|debit|credit|visa|mastercard|mada|hsbc|rajhi|alrajhi|stc)\b|بطاقة|حساب|رقم|عبر|الى|إلى|من|لصالح|لدى|مدى/gi
STRONG_LABEL_PATTERN: /^(بطاقة|حساب|account|acct|card)$/i
AMOUNT_KEYWORD_PATTERN: /\b(sar|usd|egp|amount|balance)\b|ريال|ر\.س|مبلغ|رصيد/i
CANDIDATE_PATTERN: /\*{2,}\d{3,8}|\(\d{3,8}\)|\d{3,8}/g
```

**accountInference.ts:**
```
ACCOUNT_ANCHOR_PATTERN: /\b(account|acct|a\/c|acc|card|ending|last|iban|wallet|from|to|debit|credit)\b|حساب|بطاقة|رقم|من|الى|إلى|لدى|عبر|مدى/gi
STRONG_ACCOUNT_ANCHOR: /^(account|acct|a\/c|card|حساب|بطاقة)$/i
CANDIDATE_TOKEN_PATTERN: /\*{2,}\d{3,8}|x{2,}\d{3,8}|X{2,}\d{3,8}|\d{3,8}/g
AMOUNT_CONTEXT_PATTERN: /\b(amount|amt|balance|sar|usd|egp)\b|مبلغ|رصيد|ر\.س|ريال/i
```

---

### H. Freeform Parser Data (freeformParser.ts)

**EXPENSE_VERBS (10):** paid, purchase, purchased, bought, spent, buy, دفعت, شراء, اشتريت, صرفت
**INCOME_VERBS (12):** salary, credited, received, earned, bonus, income, راتب, دخل, استلمت, مكافأة, ايراد, إيراد
**TRANSFER_VERBS (10):** transfer, transferred, sent, remittance, remit, حولت, حوالة, تحويل, أرسلت, ارسلت
**TRANSFER_IN_VERBS (3):** received, استلمت, استقبلت
**TO_MARKERS (5):** to, إلى, الى, لـ, ل
**FROM_MARKERS (2):** from, من
**TODAY_WORDS (2):** today, اليوم
**YESTERDAY_WORDS (4):** yesterday, أمس, امس, امبارح

**KEYWORD_CATEGORY_MAP (24 entries):**
```
coffee/قهوة → Food & Drink > Coffee
restaurant/مطعم → Food & Drink > Restaurants
lunch/dinner/غداء/عشاء → Food & Drink > Restaurants
groceries/بقالة/سوبرماركت/supermarket → Groceries
gas/fuel/بنزين/petrol → Transportation > Fuel
uber/taxi → Transportation > Ride
salary/راتب → Income > Salary
bonus/مكافأة → Income > Bonus
electricity/كهرباء → Utilities > Electricity
water/ماء → Utilities > Water
internet/انترنت → Utilities > Internet
pharmacy/صيدلية → Health > Pharmacy
doctor/دكتور → Health > Doctor
```

---

### I. Type Keywords Defaults (initializeXpensiaStorageDefaults.ts:264-277)

Seeded to `xpensia_type_keywords` on first run:
```json
{
  "expense": ["purchase", "pos", "mada", "spent", "paid", "atm withdrawal", "fuel",
              "food", "market", "شراء", "خصم", "بطاقة", "سداد"],
  "income": ["حوالة صادرة", "salary", "deposit", "credited", "received", "bonus",
             "commission", "incentive", "حوالة واردة", "دفعة", "راتب"],
  "transfer": ["transfer", "sent", "received from", "sent to", "تحويل", "نقل",
               "ارسال", "bank to bank", "wallet", "iban", "سحب"]
}
```

---

## 4. Template Normalizer (templateNormalizer.ts)

**Punctuation normalization:**
- `'' → '`
- `"" → "`
- `–— → -`

**Structure normalization:**
- NFKD Unicode normalization
- Whitespace collapse
- Date patterns → `DATE`: `/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g` and `/\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/g`
- Amount patterns → `AMOUNT`: `/(?:\d{1,3},)*\d+(?:\.\d{1,2})?/g`

Hash: SHA256 of normalized structure.

---

## 5. Confidence Lookup Tables

**confidenceUtils.ts:**
- `direct` → 1.0
- `inferred` → 0.7
- `default` → 0.3

**confidenceScoring.ts weights:**
- field coverage: 50%
- template match: 30%
- keyword match: 20%

**parseAndInferTransaction.ts thresholds:**
- Similar template threshold: 0.7 (70% Levenshtein similarity)
- Partial template match score: 0.6
- Status: ≥0.8 success, ≥0.4 partial, <0.4 failed

**fieldPromotionOverlay.ts thresholds:**
- Type promotion min confirms: 5, min purity: 0.95, max freshness: 90 days
- FromAccount promotion min confirms: 7, min purity: 0.98, max freshness: 90 days
- Promoted score for both: 0.85

**Freeform confidence weights (freeformParser.ts):**
- amount: 0.35, type: 0.20, date: 0.10, title: 0.15, category: 0.15, currency: 0.05

---

## 6. Normalization / Preprocessing Map

| File | Function | Transformation | Used By |
|---|---|---|---|
| `normalize-utils.ts` | `normalizeNumerals` | Arabic/Persian digits (٠-٩/۰-۹) → ASCII 0-9 | freeformParser |
| `normalize-utils.ts` | `normalizePunctuation` | Arabic punctuation (،؛؟«»etc) → ASCII | (available, unclear active usage) |
| `messageFilter.ts:65-68` | inline `normalize` | NFC + collapse whitespace + trim + lowercase | JS filter keyword matching |
| `vendorFallbackUtils.ts:40-46` | `normalizeVendorNameForCompare` | Remove zero-width chars + trim + collapse spaces + lowercase | Vendor matching, confidence graph |
| `vendorFallbackUtils.ts:48-53` | `sanitizeVendorName` | Remove zero-width chars + trim + collapse spaces | Vendor saving |
| `suggestionEngine.ts:232-237` | `softNormalize` | NFC + remove zero-width chars + lowercase | Fuzzy vendor matching |
| `suggestionEngine.ts:641-643` | inline in `extractVendorName` | NFC + remove zero-width+LRM chars | Vendor extraction |
| `templateNormalizer.ts:36-63` | `normalizeTemplateStructure` | NFKD + smart punct → ASCII + collapse WS + dates→DATE + amounts→AMOUNT | Template hashing |
| `templateHashAccountMap.ts:14-17` | `normalizeSenderKey` | trim + toLocaleLowerCase | Template-account map keys |
| `freeformParser.ts:124-129` | `tokenize` | Strip punctuation (,،.؛;:!?()) + split on whitespace | Freeform token processing |
| `freeformLearningStore.ts:41-43` | `normalizeKey` | trim + lowercase + collapse spaces | Freeform learning lookup |
| `FinancialSmsClassifier.java:26` | inline | `body.toLowerCase()` | Native keyword matching |

---

## 7. Persistence Map

| Key | Mechanism | Written By | Read By | Shape | Domain |
|---|---|---|---|---|---|
| `xpensia_template_bank` | localStorage | `saveTemplateBank` | `loadTemplateBank`, `getTemplateByHash` | `Record<string, SmartPasteTemplate>` (sender:hash → template) | SMS |
| `xpensia_structure_templates` | localStorage | init | Legacy migration in `loadTemplateBank` | `SmartPasteTemplate[]` | SMS (legacy) |
| `xpensia_template_failures` | localStorage | `incrementTemplateFailure` | (diagnostic) | `TemplateFailureRecord[]` | SMS |
| `xpensia_keyword_bank` | localStorage | `saveKeywordBank`, save-time learning | `loadKeywordBank`, `suggestionEngine` | `KeywordEntry[]` with `.mappings[{field, value}]` | SMS |
| `xpensia_type_keywords` | localStorage | init defaults, user config | `messageFilter`, `suggestionEngine` | `Record<string, string[]>` or `{keyword,type}[]` | SMS |
| `xpensia_vendor_map` | localStorage | save-time vendor remap | `structureParser.applyVendorMapping`, `confidenceScoring` | `Record<string, string>` (normalizedToken → correctedName) | SMS |
| `xpensia_vendor_fallbacks` | localStorage | init from JSON, `addUserVendor` | `loadVendorFallbacks`, `suggestionEngine` | `Record<string, VendorFallbackData>` (~8000 entries) | SMS |
| `xpensia_fromaccount_map` | localStorage | save-time account remap | `structureParser.applyFromAccountRemapping`, `confidenceScoring` | `Record<string, string>` (accountToken → accountName) | SMS |
| `xpensia_template_account_map` | localStorage | save-time `upsertTemplateAccountPreference` | `structureParser` | `Record<string, {accountId, updatedAt, count}>` | SMS |
| `xpensia_templatehash_fromaccount_map_v1` | localStorage | `recordPreferredFromAccount` | `getPreferredFromAccount` | `Record<string, {fromAccount, count, updatedAt}>` | SMS |
| `xpensia_confidence_graph_v1` | localStorage | `saveConfidenceGraph` | `getConfidenceGraph` | `{version:1, vendorEdges, templateEdges, accountTokenEdges}` | SMS |
| `xpensia_sender_category_rules` | localStorage | `learnVendorCategoryRule` | `loadSenderCategoryRules` | `Record<string, {category, subcategory}>` | SMS |
| `xpensia_vendor_suggestions` | localStorage | suggestions module | `listSuggestions` | `Record<string, {type, category, updatedAt}>` | SMS |
| `xpensia_sms_sender_import_map` | localStorage | SMS import flow | `getSmsSenderImportMap` | `Record<string, string>` (sender → lastImportDate ISO) | SMS |
| `xpensia_sms_sender_vendor_map` | localStorage | SMS vendor mapping | `getSmsSenderVendorMap` | `Record<string, Record<string, string>>` | SMS |
| `xpensia_freeform_learned_mappings` | localStorage | `learnFromFreeformConfirmation` | `lookupFreeformHint` | `FreeformLearnedMapping[]` with {normalizedVendor, category, subcategory, type, currency, confirmedCount, lastConfirmedAt} | Freeform |
| `xpensia_category_hierarchy` | localStorage | init | category UI | `CATEGORY_HIERARCHY[]` | Shared |
| `xpensia_sms_period_months` | localStorage | init, migration | `getSmsLookbackMonths` | string (number) | SMS config |

---

## 8. Regex Bank (src/data/regex-bank.ts)

```ts
DIGIT_RANGES = '0-9\u0660-\u0669\u06F0-\u06F9'  // ASCII + Arabic + Persian digits
NUMBER_FRAGMENT = `[${DIGIT_RANGES},.\u066B\u066C]+[${DIGIT_RANGES}]`
ACCOUNT_NUMBER_FRAGMENT = `[${DIGIT_RANGES}*]+`
```
**Status:** Defined but NOT used in any active parser. No imports found. Appears **legacy/unused**.

---

## 9. Legacy vs Active Findings

| Item | Status | Reason |
|---|---|---|
| `src/data/regex-bank.ts` | **LEGACY/UNUSED** | Defined constants not imported anywhere |
| `src/lib/smart-paste-engine/smsParser.ts` | **LEGACY** | Duplicate `parseSmsMessage` function; the active one is in `structureParser.ts` |
| `xpensia_structure_templates` | **LEGACY** | Migrated to `xpensia_template_bank` on load |
| `functions/functions/src/classifier.ts` | **LEGACY/UNUSED** | Firebase cloud function, basic regex, not called from app |
| `functions/functions/src/classifySMS.ts` | **LEGACY/UNUSED** | Firebase HTTP endpoint, not integrated |
| `src/services/TemplateStructureService.ts` | **LEGACY/UNUSED** | Standalone service with different regex set, not imported by active parsers |
| `src/lib/smart-paste-engine/csvLearningPipeline.ts` | **EMPTY FILE** | 0 lines |

---

## 10. Consolidated Reference Table

| Layer | Category | File | Function/Class | Constant/Key | Type | Active | Purpose |
|---|---|---|---|---|---|---|---|
| Native | A | FinancialSmsClassifier.java | `isFinancialTransactionMessage` | `FINANCIAL_KEYWORDS` | keyword list (15) | Active | SMS keyword gate |
| Native | A | FinancialSmsClassifier.java | `isFinancialTransactionMessage` | `AMOUNT_PATTERN` | regex | Active | SMS amount gate |
| JS | B | messageFilter.ts | `isFinancialTransactionMessage` | `fallbackKeywords` | keyword list (31) | Active | JS keyword gate |
| JS | B | messageFilter.ts | `isFinancialTransactionMessage` | `currencyAmountRegex` | regex | Active | JS amount gate |
| JS | B | messageFilter.ts | `isFinancialTransactionMessage` | `dateRegex` | regex (8 branches) | Active | JS date gate |
| JS | C | ProcessSmsMessages.tsx | inline | `otpKeywords` | keyword list (16) | Active | OTP exclusion |
| Parser | D | templateUtils.ts | `extractTemplateStructure` | patterns[0].regex | regex (amount+currency) | Active | Template extraction |
| Parser | D | templateUtils.ts | `extractTemplateStructure` | patterns[1].regex | regex (date, 7 branches) | Active | Template extraction |
| Parser | D | templateUtils.ts | `extractTemplateStructure` | patterns[2].regex | regex (`\*{2,4}\d{3,4}`) | Active | Account extraction |
| Parser | D | templateNormalizer.ts | `normalizeTemplateStructure` | inline regexes | regex (date+amount normalize) | Active | Template hashing |
| Engine | E | suggestionEngine.ts | `extractVendorName` | anchor patterns | regex (3 patterns) | Active | Vendor extraction |
| Engine | E | suggestionEngine.ts | `inferIndirectFieldsWithDebug` | keyword bank lookup | dynamic (localStorage) | Active | Category/type inference |
| Engine | E | suggestionEngine.ts | `findClosestFallbackMatch` | vendor fallbacks | dynamic (localStorage) | Active | Vendor→category fuzzy match |
| Engine | F | currency-utils.ts | `normalizeCurrencyCode` | `CURRENCY_NAME_TO_CODE` | map (28 entries) | Active | Currency normalization |
| Engine | F | currency-utils.ts | — | `VALID_CURRENCY_CODES` | set (62 codes) | Active | Currency validation |
| Engine | G | accountCandidates.ts | `extractAccountCandidates` | `ANCHOR_PATTERN` | regex | Active | Account inference |
| Engine | G | accountInference.ts | `extractAccountCandidates` | `ACCOUNT_ANCHOR_PATTERN` | regex | Active | Account inference v2 |
| Learning | I | keywordBankUtils.ts | load/save | `xpensia_keyword_bank` | storage key | Active | Keyword→field mappings |
| Learning | I | vendorFallbackUtils.ts | load/save | `xpensia_vendor_fallbacks` | storage key | Active | Vendor→category mappings |
| Learning | I | structureParser.ts | `applyVendorMapping` | `xpensia_vendor_map` | storage key | Active | Vendor name corrections |
| Learning | I | structureParser.ts | `applyFromAccountRemapping` | `xpensia_fromaccount_map` | storage key | Active | Account name corrections |
| Learning | I | templateUtils.ts | load/save | `xpensia_template_bank` | storage key | Active | Template structures |
| Learning | I | templateHashAccountMap.ts | record/get | `xpensia_templatehash_fromaccount_map_v1` | storage key | Active | Template→account preference |
| Learning | I | confidenceGraph.ts | get/save | `xpensia_confidence_graph_v1` | storage key | Active | Field promotion history |
| Learning | I | senderCategoryRules.ts | load/save | `xpensia_sender_category_rules` | storage key | Active | Sender→category rules |
| Learning | I | saveTransactionWithLearning.ts | upsert | `xpensia_template_account_map` | storage key | Active | Template→account map |
| Freeform | J | freeformParser.ts | `parseFreeformTransaction` | `EXPENSE_VERBS` etc. | keyword sets (6) | Active | Freeform intent detection |
| Freeform | J | freeformParser.ts | `parseFreeformTransaction` | `CURRENCY_MAP` | map (27 entries) | Active | Freeform currency detection |
| Freeform | J | freeformParser.ts | `parseFreeformTransaction` | `KEYWORD_CATEGORY_MAP` | map (24 entries) | Active | Freeform category suggestion |
| Freeform | J | freeformLearningStore.ts | load/save | `xpensia_freeform_learned_mappings` | storage key | Active | Freeform learning (isolated) |
| Seed | I | initializeXpensiaStorageDefaults.ts | init | `xpensia_type_keywords` default | seed data | Active | Default type keywords |
| Seed | I | initializeXpensiaStorageDefaults.ts | init | ksa_all_vendors_clean_final.json | seed data (8037 lines) | Active | Default vendor fallbacks |
| Norm | K | normalize-utils.ts | `normalizeNumerals` | numeral map (20 chars) | normalization | Active | Arabic/Persian → ASCII digits |
| Norm | K | vendorFallbackUtils.ts | `normalizeVendorNameForCompare` | zero-width + lowercase | normalization | Active | Vendor key normalization |
| Legacy | — | regex-bank.ts | — | `DIGIT_RANGES`, `NUMBER_FRAGMENT` | regex fragments | **Legacy** | Not imported anywhere |
| Legacy | — | smsParser.ts | `parseSmsMessage` | `amountRegex`, `dateRegex` | regex | **Legacy** | Superseded by structureParser |
| Legacy | — | TemplateStructureService.ts | `generateTemplateStructure` | inline regexes | regex | **Legacy** | Not used in active paths |
| Legacy | — | classifier.ts (Firebase) | `classifyText` | inline regexes | regex | **Legacy** | Cloud function, not called |

