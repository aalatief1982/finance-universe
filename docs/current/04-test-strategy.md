# Xpensia — Test Strategy

> **Status**: Living document  
> **Last synced with codebase**: 2026-03-11

---

## 1. Goals

- Ensure parsing accuracy across Arabic/English SMS patterns
- Validate end-to-end flows: SMS → parse → review → edit → save → learning
- Prevent regressions in template matching and field extraction
- Verify native/web platform parity for storage and navigation

## 2. Test Levels

### Unit Tests
- **Location**: `src/pages/__tests__/`, `src/lib/**/*.test.ts`
- **Framework**: Vitest (via `bunx vitest`)
- **Focus**: Parsing engine, inference DTO normalization, field scoring, currency formatting

### Component Tests
- **Location**: Co-located `.test.tsx` files
- **Focus**: SmartPaste input handling, transaction form validation, filter behavior

### Integration Tests
- **Location**: `src/pages/__tests__/`
- **Focus**: Page-level flows (ImportTransactions error handling)

### E2E Tests
- **Framework**: Playwright (`@playwright/test`)
- **Focus**: Critical user journeys (onboarding, smart entry, transaction CRUD)

## 3. Critical Test Areas

| Area | Priority | Reason |
|---|---|---|
| `parseAndInferTransaction` | P0 | Core parsing engine — any regression breaks all input |
| `buildInferenceDTO` | P0 | DTO normalization affects all downstream UI |
| SMS financial classifier | P0 | False negatives = missed transactions |
| `saveTransactionWithLearning` | P1 | Learning corruption = degraded future parsing |
| SMS inbox queue lifecycle | P1 | Queue bugs = lost SMS items |
| Transaction CRUD | P1 | Data integrity |
| FX aggregation | P2 | Incorrect totals on dashboard |
| Budget alert thresholds | P2 | Missed/false budget alerts |

## 4. Platform-Specific Testing

| Scenario | Web | Android |
|---|---|---|
| SMS background listener | N/A (mock) | Native BroadcastReceiver |
| Storage | localStorage | Capacitor Preferences |
| Share sheet | N/A | ShareTargetPlugin |
| Notifications | N/A | Local notifications |
| Camera | N/A | Capacitor Camera |

## 5. Regression Strategy

- All parsing template changes must include test messages
- Learning engine changes must verify existing entries are not corrupted
- Navigation changes must verify all routes in `route-constants.ts` resolve correctly
- Storage key changes require migration path testing

## 6. Entry/Exit Criteria

**Entry**: Feature branch passes lint + unit tests  
**Exit**: All P0/P1 test areas pass, no console errors on critical flows, manual smoke test on Android device for native features
