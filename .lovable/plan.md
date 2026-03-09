## Plan: Fix Smart Entry Typing Latency

### Status: ✅ Implemented

### Root Cause
`parseSmsMessage()` (full parsing pipeline: template matching, regex, localStorage reads, inference) was called on **every keystroke** via a `useEffect` watching `text` in `SmartPaste.tsx`. Additionally, `computeCapturedFields()` ran on every render without memoization.

### What was changed

**`src/components/SmartPaste.tsx`**
1. **Removed `parseSmsMessage` from keystroke path** — deleted the `useEffect` (formerly L179-209) that ran the full parser on every text change. Match status is now computed only after the user taps "Review Transaction" inside `handleSubmit`.
2. **Memoized `computeCapturedFields`** — wrapped in `useMemo` with proper dependencies to avoid recalculation on unrelated re-renders.
3. **Removed unused import** — `parseSmsMessage` import removed since it's no longer called directly.

### What is NOT changed
- `handleSubmit` and full parse pipeline — unchanged (runs on Review tap)
- SMS parsing logic (`structureParser.ts`, `suggestionEngine.ts`) — untouched
- Voice transcript merging — unchanged
- Shared text prefill logic — unchanged
- `NERSmartPaste.tsx` — unchanged
- `DetectedTransactionCard`, `NoTransactionMessage` — unchanged
- Parser files — unchanged

### Verification checklist
- [ ] Typing in Smart Entry is responsive (no lag per keystroke)
- [ ] Pasting large text works
- [ ] Shared text prefill works
- [ ] Voice transcript insertion works
- [ ] Tapping "Review Transaction" runs parser and shows results
- [ ] Match status updates correctly after review
- [ ] No regressions in Smart Entry flow
