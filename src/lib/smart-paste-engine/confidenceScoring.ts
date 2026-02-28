/**
 * @file confidenceScoring.ts
 * @description Confidence scoring utilities for Smart Paste parsing.
 *              Combines field, template, and keyword signals.
 *
 * @module lib/smart-paste-engine/confidenceScoring
 *
 * @responsibilities
 * 1. Score field coverage based on parsed/inferred/defaulted values
 * 2. Score template match confidence
 * 3. Score keyword-based consistency using vendor/category maps
 * 4. Combine scores into overall confidence
 *
 * @dependencies
 * - safeStorage: xpensia_vendor_map, xpensia_fromaccount_map
 *
 * @review-tags
 * - @side-effects: reads localStorage for user mappings
 * - @risk: vendor keyword matching only uses first token
 *
 * @review-checklist
 * - [ ] Field score includes both inferred and defaulted values
 * - [ ] Keyword score averages only when a source contributes
 * - [ ] Overall weighting matches UX expectations
 */

import { safeStorage } from '@/utils/safe-storage';
import type { ParsedField } from './structureParser';

interface ParsedResult {
  directFields?: Record<string, ParsedField>;
  inferredFields?: Record<string, ParsedField>;
  defaultValues?: Record<string, ParsedField>;
}

interface TransactionLike {
  vendor?: string;
  category?: string;
  subcategory?: string;
  fromAccount?: string;
  [key: string]: unknown;
}

interface KeywordBankEntry {
  keyword: string;
  mappings: { field: string; value: string }[];
}

export function getFieldConfidence(parsed: ParsedResult): number {
  const totalFields = ['amount', 'currency', 'date', 'type', 'category', 'subcategory', 'vendor', 'fromAccount'];
  const filledFields = totalFields.filter(field => {
    return parsed.directFields?.[field] || parsed.inferredFields?.[field] || parsed.defaultValues?.[field];
  });

  return filledFields.length / totalFields.length;
}

export function getTemplateConfidence(templateMatched: number, totalTemplates: number): number {
  if (totalTemplates === 0) return 0;
  return templateMatched;
}

export function getKeywordConfidence(transaction: TransactionLike, keywordBank: KeywordBankEntry[]): number {
  let totalScore = 0;
  let sourceCount = 0;

  if (transaction.vendor) {
    const keyword = transaction.vendor.toLowerCase().split(' ')[0];
    const entry = keywordBank.find(k => k.keyword === keyword);
    if (entry && entry.mappings) {
      const fieldsMatched = entry.mappings.filter(m =>
        m.value === transaction[m.field]
      ).length;
      if (fieldsMatched > 0) {
        totalScore += fieldsMatched / entry.mappings.length;
        sourceCount++;
      }
    }
  }

  const vendorMap = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
  if (transaction.vendor) {
    const isUserMappedVendor = Object.values(vendorMap).includes(transaction.vendor);
    if (isUserMappedVendor) {
      totalScore += 0.8;
      sourceCount++;
    }
  }

  if (transaction.category || transaction.subcategory) {
    const hasKeywordBankMatch = keywordBank.some(entry => 
      entry.mappings.some(mapping => 
        (mapping.field === 'category' && mapping.value === transaction.category) ||
        (mapping.field === 'subcategory' && mapping.value === transaction.subcategory)
      )
    );
    if (hasKeywordBankMatch) {
      totalScore += 0.7;
      sourceCount++;
    }
  }

  const fromAccountMap = JSON.parse(safeStorage.getItem('xpensia_fromaccount_map') || '{}');
  if (transaction.fromAccount) {
    const isUserMappedFromAccount = Object.values(fromAccountMap).includes(transaction.fromAccount);
    if (isUserMappedFromAccount) {
      totalScore += 0.8;
      sourceCount++;
    }
  }

  return sourceCount > 0 ? totalScore / sourceCount : 0;
}

export function computeOverallConfidence(
  fieldScore: number,
  templateScore: number,
  keywordScore: number
): number {
  return (
    fieldScore * 0.5 +
    templateScore * 0.3 +
    keywordScore * 0.2
  );
}

export function computeConfidenceScore(source: 'direct' | 'inferred' | 'default'): number {
  switch (source) {
    case 'direct': return 0.9;
    case 'inferred': return 0.6;
    case 'default': return 0.3;
    default: return 0;
  }
}
