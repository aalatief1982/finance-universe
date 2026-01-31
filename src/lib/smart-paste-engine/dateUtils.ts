/**
 * @file dateUtils.ts
 * @description Date parsing and normalization for Smart Paste engine.
 *              Handles multiple date formats common in bank SMS messages.
 *
 * @responsibilities
 * - Normalize various date formats to ISO yyyy-MM-dd
 * - Handle short year formats (yy vs yyyy)
 * - Support both slash and dash separators
 *
 * @dependencies
 * - date-fns: parse, isValid, format functions
 *
 * @review-checklist
 * - [ ] Manual DD/MM/YY parsing runs BEFORE date-fns to avoid misparse
 * - [ ] Short year threshold: <50 = 20xx, >=50 = 19xx
 * - [ ] All common bank SMS date formats are covered
 *
 * @review-tags
 * - @review-risk: date-fns parse can misinterpret 2-digit years
 * - @review-focus: Manual slash format handling (lines 31-36)
 */

import { parse, isValid, format } from 'date-fns';

// ============================================================================
// SECTION: Supported Date Formats
// PURPOSE: Define all date patterns found in bank SMS messages
// REVIEW: Order matters - more specific formats should come first
// ============================================================================

const possibleFormats = [
  'dd-MM-yy HH:mm',
  'dd-MM-yy',
  'd-M-yy HH:mm',
  'd-M-yy',
  'dd-MM-yyyy HH:mm',
  'dd-MM-yyyy',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'd/M/yyyy',
  'd/M/yy',
  'dd/MM/yyyy',
  'dd/MM/yy',
  'dd MMM yyyy',
  'MMMM d yyyy',
  'MMM d yyyy',
  'MMMM d, yyyy',
  'MMM d, yyyy',
  'd MMM yyyy HH:mm',
  'MMMM d yyyy HH:mm',
  'yyyy-MM-dd HH:mm',
];

// ============================================================================
// SECTION: Date Normalization
// PURPOSE: Convert any detected date format to ISO yyyy-MM-dd
// REVIEW: Manual parsing for DD/MM/YY to avoid date-fns 2-digit year bugs
// @review-risk: date-fns may misparse short years (e.g., 25 → 0025)
// ============================================================================

/**
 * Normalize a date string to ISO format (yyyy-MM-dd).
 * 
 * @param input - Date string in various formats
 * @returns ISO date string or null if unparseable
 * 
 * @review-focus
 * - Manual slash format parsing runs FIRST to avoid date-fns misparse
 * - Short year handling: yy < 50 → 20yy, yy >= 50 → 19yy
 * - Falls back to date-fns for more complex formats
 */
export function normalizeDate(input: string): string | null {
  const trimmed = input.trim();
  
  // CRITICAL: Handle DD/MM/YY slash format manually FIRST
  // date-fns misparses 2-digit years (e.g., "25" as year 0025)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashMatch) {
    const [, dd, mm, yy] = slashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  
  // Try each format with date-fns
  for (const fmt of possibleFormats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd'); // For <input type="date" />
    }
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[normalizeDate] Could not parse:', input);
  }
  return null;
}
