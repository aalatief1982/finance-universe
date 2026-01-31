/**
 * @file confidenceUtils.ts
 * @description Lightweight confidence scoring helpers for smart-paste fields.
 *
 * @module lib/smart-paste-engine/confidenceUtils
 *
 * @responsibilities
 * 1. Map source types (direct/inferred/default) to confidence values
 *
 * @review-tags
 * - @risk: score tuning impacts UI confidence thresholds
 *
 * @review-checklist
 * - [ ] Default score returns 0 for unknown source
 */

export function computeConfidenceScore(source: 'direct' | 'inferred' | 'default'): number {
  switch (source) {
    case 'direct':
      return 1.0;
    case 'inferred':
      return 0.7;
    case 'default':
      return 0.3;
    default:
      return 0;
  }
}
