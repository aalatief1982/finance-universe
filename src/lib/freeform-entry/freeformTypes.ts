/**
 * @file freeformTypes.ts
 * @description Type definitions for the freeform fallback parser.
 *              Completely isolated from SMS/template parsing types.
 *
 * @module lib/freeform-entry/freeformTypes
 */

import type { TransactionType } from '@/types/transaction';

/** Per-field confidence breakdown for freeform extraction */
export interface FreeformFieldConfidences {
  amount: number;
  type: number;
  date: number;
  title: number;
  category: number;
  currency: number;
  counterparty: number;
}

/** Result of freeform fallback parsing */
export interface FreeformParseResult {
  /** Whether a valid amount was found (minimum gate) */
  success: boolean;
  /** Extracted amount (0 if not found) */
  amount: number;
  /** Detected transaction type */
  type: TransactionType;
  /** Extracted or defaulted date (ISO string YYYY-MM-DD) */
  date: string;
  /** Whether the date was explicitly found or defaulted to today */
  dateDefaulted: boolean;
  /** Title / vendor residue after stripping known tokens */
  title: string;
  /** Suggested category (conservative) */
  category: string;
  /** Suggested subcategory */
  subcategory: string;
  /** Detected or default currency code */
  currency: string;
  /** Counterparty name for transfers (e.g., "Ahmed" from "transferred 500 to Ahmed") */
  counterparty: string;
  /** Per-field confidence scores */
  fieldConfidences: FreeformFieldConfidences;
  /** Overall confidence (weighted average of field confidences) */
  confidence: number;
  /** Optional marker when values are filled from freeform learned mapping */
  learnedMappingApplied?: {
    normalizedVendor: string;
    appliedFields: Array<'category' | 'subcategory' | 'type' | 'currency'>;
  };
}

/** A single learned vendor/phrase → category/type mapping */
export interface FreeformLearnedMapping {
  normalizedVendor: string;
  category: string;
  subcategory?: string;
  type: TransactionType;
  currency?: string;
  confirmedCount: number;
  lastConfirmedAt: string;
}
