

# Create SMS Flow Analysis Report

## What will be created

A single file `docs/sms-flow-analysis-report.md` containing a comprehensive analysis of:

1. **Navigation Loop Root Cause** -- The `useEffect` at line 487 of `App.tsx` includes `location.pathname` in its dependency array (line 554). When the flow coordinator routes to `/process-sms`, the path change re-triggers the effect, creating an infinite re-render loop when provider state never resolves to "configured."

2. **Bulk Import Flow** -- Full walkthrough of `SmsFlowCoordinator` -> `SmsImportService` -> `/vendor-mapping` -> `/review-sms-transactions`, including:
   - Sender selection and legacy migration logic
   - Per-sender checkpoint dates and scan windows
   - Financial message filtering (keyword + amount + date triple-gate in `messageFilter.ts`)
   - Vendor mapping and keyword map construction
   - Session-level prompt guards (`autoPromptShown`, `autoPromptAccepted`)

3. **Real-Time SMS Listener Flow** -- How `BackgroundSmsListener` in `App.tsx` (lines 370-485):
   - Receives all incoming SMS via native plugin
   - Filters with `isFinancialTransactionMessage()` (no sender allow-list)
   - Parses via `buildInferenceDTO()` -> `parseAndInferTransaction()`
   - Auto-navigates to `/edit-transaction` when app is active, or schedules a local notification when backgrounded

4. **Inference Rules** -- Detailed breakdown per field:
   - **Amount**: Regex extraction from placeholders, first numeric match
   - **Date**: Regex with `normalizeDate()` supporting DD-MM-YY and ISO formats
   - **Vendor**: Anchor-pattern regex (Arabic + English prepositions), domain-like fallback, salary keyword fallback
   - **Type**: `xpensia_type_keywords` lookup (object format: `{expense: [...], income: [...]}`)
   - **Category/Subcategory**: Keyword bank -> vendor fallback (fuzzy 70% threshold) -> income default ("Earnings > Benefits")
   - **fromAccount/toAccount**: Direct field -> token remap -> template-hash map -> template default -> senderHint fallback

5. **Smart Entry Intersection** -- How bulk import (`smsParser.ts`) and real-time listener both call into the same `suggestionEngine.ts` and `structureParser.ts` pipeline, but with divergent entry points and inconsistencies (e.g., `smsParser.ts` uses its own simpler regex vs `structureParser.ts` template system)

6. **Guardrails Inventory** -- Table of all existing guards: import lock, `MAX_SAFE_LIMIT`, `isCancelled` flag, platform checks, session prompt flags, empty-string guards in fuzzy matching

7. **UX/UI Consultancy** -- Expert recommendations:
   - Fix the navigation loop (remove `location.pathname` from deps, add `useRef` guard)
   - Replace `window.confirm/alert` with themed in-app dialogs
   - Queue real-time SMS as non-blocking notifications instead of auto-navigating
   - Add sender allow-list to real-time listener
   - Add transaction deduplication (hash of sender + body + date)
   - Collapse the 4-step import flow into fewer screens

## Technical details

- Single new file: `docs/sms-flow-analysis-report.md`
- No code modifications
- Report structured with clear sections, tables, and code references with line numbers

