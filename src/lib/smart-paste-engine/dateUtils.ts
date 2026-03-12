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
/**
 * Expand a 2-digit year: <50 → 20xx, >=50 → 19xx
 */
function expandYear(yy: number): number {
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function scoreDateCandidate(candidateIso: string, anchorMs: number): number {
  const candidateMs = new Date(candidateIso).getTime();
  const diffDays = (candidateMs - anchorMs) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) return 1e9 + diffDays;
  if (diffDays < -400) return 1e8 + Math.abs(diffDays);
  return Math.abs(diffDays);
}

/**
 * Normalize a date string to ISO format (yyyy-MM-dd).
 * For ambiguous short-numeric dates, generates multiple candidates
 * and picks the closest to anchorDate.
 * 
 * @param input - Date string in various formats
 * @param anchorDate - Reference timestamp in ms (default: Date.now())
 * @returns ISO date string or null if unparseable
 */
export function normalizeDate(input: string, anchorDate?: number): string | null {
  const trimmed = input.trim();
  const anchor = anchorDate ?? Date.now();
  
  // Handle ambiguous A/B/C where C is 2-digit (could be DD/MM/YY, YY/M/DD, MM/DD/YY)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashMatch) {
    const [a, b, c] = [parseInt(slashMatch[1], 10), parseInt(slashMatch[2], 10), parseInt(slashMatch[3], 10)];
    const candidates: { iso: string; score: number }[] = [];

    // DD/MM/YY
    const y1 = expandYear(c);
    if (isValidCalendarDate(y1, b, a)) {
      const iso = `${y1}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreDateCandidate(iso, anchor) });
    }
    // YY/M/DD
    const y2 = expandYear(a);
    if (isValidCalendarDate(y2, b, c)) {
      const iso = `${y2}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreDateCandidate(iso, anchor) });
    }
    // MM/DD/YY
    const y3 = expandYear(c);
    if (isValidCalendarDate(y3, a, b)) {
      const iso = `${y3}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
      candidates.push({ iso, score: scoreDateCandidate(iso, anchor) });
    }

    if (candidates.length > 0) {
      candidates.sort((x, y) => x.score - y.score);
      return candidates[0].iso;
    }
  }
  
  // Try each format with date-fns
  for (const fmt of possibleFormats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[normalizeDate] Could not parse:', input);
  }
  return null;
}
