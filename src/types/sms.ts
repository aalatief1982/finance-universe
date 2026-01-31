/**
 * @file sms.ts
 * @description Type definitions for sms.
 *
 * @module types/sms
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */
export type VendorEntry = {
  vendor: string;
  category: string;
  subcategory: string;
};
