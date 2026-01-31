# Review Commenting Guide

This guide documents the review-comment conventions used across the Xpensia codebase.
It complements file-level headers, section comments, and JSDoc annotations introduced
in the documentation phases.

## Goals

- Provide a consistent vocabulary for manual code review
- Make high-risk or correctness-critical logic easy to spot
- Reduce reliance on fragile line-number references

## Review Tags

Use these tags in file headers or JSDoc blocks:

- `@risk`: correctness-critical logic or areas with a history of regressions
- `@invariant`: assumptions that must always hold true
- `@side-effects`: mutations of storage, analytics events, IO, or global state
- `@performance`: loops or heavy computation that might grow with data size
- `@error-handling`: try/catch or fallback paths where failures are expected
- `@platform`: platform-specific logic (web vs native)
- `@usability`: UI/UX logic that affects user expectations

## Review Checklists

When possible, include a `@review-checklist` section in file headers. Keep it short
and actionable, focusing on conditions that should be verified during manual review.

Example:

```ts
/**
 * @review-checklist
 * - [ ] Transfer pairs include one debit and one credit record
 * - [ ] Storage updates broadcast StorageEvent correctly
 */
```

## Review Anchors

Use stable anchor comments to avoid line-number references in review notes:

```
// REVIEW-ANCHOR: transfer-signs
```

Anchors should be unique within a file and should correspond to the smallest
logical block that needs extra scrutiny.

## Section Comments

Use section comments to delineate major flows or functional groups:

```ts
// ============================================================================
// SECTION: Category Rules
// PURPOSE: Manage priority-based category rule ordering
// REVIEW: Ensure rule insertion preserves correct priority order
// ============================================================================
```

## Where to Apply

Recommended locations for these conventions:

- Services and storage utilities (business rules + side effects)
- Smart-paste parsing and inference logic
- Contexts and hooks that orchestrate state or persistence
- UI screens with complex filtering, deletion, or edit flows
