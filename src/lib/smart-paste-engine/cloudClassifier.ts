/**
 * @file cloudClassifier.ts
 * @description Placeholder for cloud-based SMS classification (disabled).
 *
 * @module lib/smart-paste-engine/cloudClassifier
 *
 * @responsibilities
 * 1. Provide async API surface for cloud classifier integration
 * 2. Return empty result when cloud classifier is disabled
 *
 * @review-tags
 * - @risk: cloud classifier disabled in production builds
 *
 * @review-checklist
 * - [ ] Function remains async-compatible for future integration
 */

// Cloud classifier disabled
export async function classifySmsViaCloud(text: string) {
  return {};
}
