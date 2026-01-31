/**
 * @file templateNormalizer.ts
 * @description Normalizes template strings and generates stable hashes.
 *
 * @module lib/smart-paste-engine/templateNormalizer
 *
 * @responsibilities
 * 1. Normalize punctuation, whitespace, dates, and amounts
 * 2. Return normalized structure + SHA256 hash
 *
 * @dependencies
 * - crypto-js/sha256: hashing implementation
 *
 * @review-tags
 * - @risk: over-normalization may collapse distinct templates
 *
 * @review-checklist
 * - [ ] Date patterns normalized consistently
 * - [ ] Amount patterns replaced with AMOUNT token
 * - [ ] Hash computed from normalized structure
 */

import SHA256 from 'crypto-js/sha256';

export interface NormalizedTemplate {
  structure: string;
  hash: string;
}

/**
 * Normalize a template string for hashing.
 * - Converts smart punctuation to standard ASCII
 * - Collapses whitespace
 * - Normalizes common date and amount patterns
 */
export function normalizeTemplateStructure(msg: string): NormalizedTemplate {
  if (!msg) return { structure: '', hash: SHA256('').toString() };

  let text = msg.normalize('NFKD');

  // Smart punctuation replacements
  const replacements: [RegExp, string][] = [
    [/[‘’]/g, "'"],
    [/[“”]/g, '"'],
    [/[–—]/g, '-']
  ];
  for (const [regex, rep] of replacements) {
    text = text.replace(regex, rep);
  }

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Normalize date patterns to placeholder
  text = text.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, 'DATE');
  text = text.replace(/\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g, 'DATE');

  // Normalize numeric amounts
  text = text.replace(/(?:\d{1,3},)*\d+(?:\.\d{1,2})?/g, 'AMOUNT');

  const hash = SHA256(text).toString();
  return { structure: text, hash };
}

export default normalizeTemplateStructure;
