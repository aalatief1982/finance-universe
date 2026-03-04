# Confidence Overlay Report

## What changed
- Added a new confidence graph store in localStorage: `xpensia_confidence_graph_v1`.
- Added conservative promotion overlay logic for **type** and **fromAccount** only.
- Wired learning updates on transaction save to record confirmations/contradictions into the confidence graph.
- Added promotion evidence payload into debug trace and Engine Out rendering.
- Added unit tests covering trigger, block, stricter fromAccount rules, and kill switch.

## Feature flag
- Flag: `VITE_CONFIDENCE_OVERLAY_ENABLED`
- Source: `src/lib/envFlags.ts`
- Default: `false`

## Promotion decision rules
- Type promotion (`0.7 -> 0.85`):
  - `confirm >= 5`
  - `purity >= 0.95`
  - freshness within 90 days
  - plus strong parser anchor (exact template match OR direct vendor extraction)
- FromAccount promotion (`0.3 -> 0.85`):
  - `confirm >= 7`
  - `purity >= 0.98`
  - freshness within 90 days
  - evidence allowed only from template/account-token edges (not vendor-only)
- Any contradiction (`contradict > 0`) blocks promotion.

## How to verify in Engine Out
1. Enable `VITE_CONFIDENCE_OVERLAY_ENABLED=true`.
2. Save repeated confirmed transactions to build graph evidence.
3. Parse a similar message.
4. Open Engine Out and inspect:
   - field evidence line: `Promoted by historical confirmation overlay.`
   - `promotionOverlay` section with edge key, value key, confirm/contradict/purity/freshness.
