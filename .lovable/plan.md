

## Investigation Report: Smart Entry Typing Latency

### Root Cause Found

**Primary cause (HIGH confidence):** In `SmartPaste.tsx` lines 179-209, a `useEffect` watches `text` and runs `parseSmsMessage(text, senderHint)` on **every keystroke**.

```javascript
useEffect(() => {
    if (!text.trim()) { ... return; }
    try {
      const parsed = parseSmsMessage(text, senderHint);  // HEAVY — runs on every keystroke
      // template matching, regex, localStorage reads, inference...
```

`parseSmsMessage` (in `structureParser.ts`, 468 lines) is the full structure parser pipeline: template extraction, template hash lookup, localStorage reads, regex matching, vendor inference, account candidate extraction, confidence scoring. This is an expensive operation designed to run once on submit — not on every character typed.

**Secondary cause (MEDIUM):** `computeCapturedFields()` at line 335 runs on every render (not in a `useMemo`), recalculating field status each time the component re-renders from the `text` state change.

**Tertiary cause (LOW):** The prefill confirmation `useEffect` at line 157 also watches `text`, but it's lightweight (ref comparisons only).

### Files Involved

| File | Issue |
|------|-------|
| `src/components/SmartPaste.tsx` L179-209 | `parseSmsMessage` called on every keystroke via useEffect |
| `src/components/SmartPaste.tsx` L335-344 | `computeCapturedFields` not memoized |

### What Does NOT Cause Lag
- The `onChange` handler on the Textarea (L428) is just `setText(e.target.value)` — fine
- Voice transcript merge (L118-120) — only on speech result, not on typing
- `handleSubmit` — only on form submit
- `NERSmartPaste.tsx` — separate component, no useEffect on text

---

## Safe Fix Plan

### Fix 1: Remove `parseSmsMessage` from the keystroke path (PRIMARY FIX)

Remove the `useEffect` at lines 179-209 that calls `parseSmsMessage(text, senderHint)` on every `text` change. The match status preview is a nice-to-have but is the direct cause of lag. Instead, only show match status after the user taps "Review Transaction" (which already calls `parseAndInferTransaction`).

**Change:** Delete the useEffect (lines 179-209). Set `matchStatus` and `hasMatch` inside `handleSubmit` instead, using the result that's already computed there.

### Fix 2: Memoize `computeCapturedFields` (SECONDARY FIX)

Wrap the `computeCapturedFields` call in `useMemo` depending on `detectedTransactions[0]`, `fieldConfidences`, `confidence`, and `matchOrigin`.

### What stays the same
- Textarea `onChange` handler — unchanged
- `handleSubmit` and full parse pipeline — unchanged
- SMS parsing logic — untouched
- Voice/shared text prefill — unchanged
- `NERSmartPaste.tsx` — unchanged
- Parser files — unchanged

