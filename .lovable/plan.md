

## Plan: Fix Build Errors + Add Admin-Protected Storage Management Buttons

### Part 1 — Fix TypeScript Build Errors

**Root cause**: In `parserTrace.ts` line 3, the `StageKey` conditional type tries to infer keys from `stageTimingsMs` but it's typed as `Partial<Record<K, number>>`, not `Record<K, number>`. The `Partial` wrapper prevents the `infer K` from resolving, so `StageKey` becomes `never`.

**Fix** in `src/lib/smart-paste-engine/parserTrace.ts` line 3: Replace the conditional type with a direct extraction:

```typescript
type StageKey = NonNullable<InferenceDecisionTrace['operational']>['stageTimingsMs'] extends 
  Partial<Record<infer K, number>> ? K : never;
```

This should work because `Partial<Record<K, number>>` does match the `Partial<Record<infer K, ...>>` pattern. If the current TS version doesn't resolve it, fall back to explicitly listing the union type from `inference.ts` lines 93-103:

```typescript
type StageKey = 'normalize' | 'gate' | 'template_extraction' | 'template_exact_lookup' | 
  'template_similarity_fallback' | 'direct_extraction' | 'suggestion_engine' | 
  'vendor_fallback' | 'final_merge' | 'dto_build';
```

The explicit union is safer and still single-source since it mirrors the type in `inference.ts`.

### Part 2 — Add 3 Admin-Protected Storage Buttons

**Location**: `src/pages/Settings.tsx`, in the Data Management section (after the Import button around line 789), behind the existing `adminMode` guard.

**Three buttons**:

1. **Backup All Storage** — Collects all `localStorage` keys/values into a JSON object, downloads as `.json` file (web: anchor download, native: `Filesystem.writeFile` to Documents)
2. **Restore Backup** — File picker for `.json`, user chooses Replace (clear all then write) or Append (merge keys), then applies to `localStorage` and reloads
3. **Clear All Storage** — Confirmation dialog, then `localStorage.clear()` and reload

**UI placement**: New subsection inside the Data Management `<section>`, wrapped in `{adminMode && (...)}` so only visible when admin mode is active. Three vertically stacked buttons with icons (HardDrive/Download, UploadCloud, Trash2).

**Implementation details**:
- Backup serializes `Object.keys(localStorage)` into `{ [key]: value }` JSON
- Restore uses `AlertDialog` to ask Replace vs Append before applying
- Clear uses `AlertDialog` with destructive confirmation
- Both Restore and Clear trigger `window.location.reload()` after completion
- Native platform uses `Filesystem.writeFile` for backup download
- Toast feedback for all actions

### Files Changed

1. `src/lib/smart-paste-engine/parserTrace.ts` — Fix `StageKey` type
2. `src/pages/Settings.tsx` — Add 3 admin-guarded storage management buttons

