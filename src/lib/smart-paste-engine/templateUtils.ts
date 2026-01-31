/**
 * @file templateUtils.ts
 * @description Core template bank operations for Smart Paste engine.
 *              Handles template storage, retrieval, matching, and failure tracking.
 *
 * @responsibilities
 * - Template bank CRUD (load, save, get by hash)
 * - Dual-key indexing: {sender}:{templateHash} for sender-scoped isolation
 * - Template structure extraction from raw SMS messages
 * - Legacy migration from array-based to keyed storage
 * - Template failure tracking for auto-retraining triggers
 *
 * @storage-keys
 * - xpensia_template_bank: Primary template storage (keyed by sender:hash)
 * - xpensia_structure_templates: Legacy array storage (migrated on load)
 * - xpensia_template_failures: Failure records for flagged templates
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 * - suggestionEngine.ts: extractVendorName for vendor placeholder
 * - templateNormalizer.ts: normalizeTemplateStructure for hash generation
 * - currency-utils.ts: normalizeCurrencyCode for Arabic currency names
 *
 * @review-checklist
 * - [ ] Template key generation uses sender fallback correctly
 * - [ ] Legacy migration preserves existing templates
 * - [ ] Failure threshold triggers storage write
 * - [ ] Amount+currency regex handles Arabic and Eastern numerals
 *
 * @review-tags
 * - @review-risk: extractTemplateStructure regex patterns (lines 172-199)
 * - @side-effects: modifies localStorage on template save/load
 * - @platform: web-only (no native storage)
 */

import { safeStorage } from "@/utils/safe-storage";
import { extractVendorName } from './suggestionEngine';
import { SmartPasteTemplate, TemplateMeta } from '@/types/template';
import { normalizeTemplateStructure } from './templateNormalizer';
import { normalizeCurrencyCode } from '@/utils/currency-utils';

const TEMPLATE_BANK_KEY = 'xpensia_template_bank';

// ============================================================================
// SECTION: Template Metadata
// PURPOSE: Ensure all templates have lifecycle tracking fields
// REVIEW: Backward compatibility with legacy templates missing meta
// ============================================================================

function ensureTemplateMeta(t: SmartPasteTemplate): TemplateMeta {
  const meta: TemplateMeta = {
    createdAt: t.meta?.createdAt || t.created || new Date().toISOString(),
    lastUsedAt: t.meta?.lastUsedAt,
    usageCount: t.meta?.usageCount ?? 0,
    successCount: t.meta?.successCount ?? 0,
    fallbackCount: t.meta?.fallbackCount ?? 0,
  };
  t.meta = meta;
  return meta;
}

// ============================================================================
// SECTION: Template Key Generation
// PURPOSE: Create dual-key format {sender}:{hash} for sender isolation
// REVIEW: Fallback chain: sender → fromAccount → '__unknown__'
// ============================================================================

/**
 * Generate a template storage key using sender-scoped indexing.
 * Falls back to fromAccount if sender is missing.
 * 
 * @param sender - SMS sender identifier (e.g., "ALRAJHI")
 * @param fromAccount - Account identifier as fallback
 * @param hash - Template structure hash
 * @returns Key in format "sender:hash" or "__unknown__:hash"
 */
export function getTemplateKey(
  sender: string | undefined,
  fromAccount: string | undefined,
  hash: string
): string {
  let base = sender?.toLowerCase().trim();
  if (!base) base = fromAccount?.toLowerCase().trim();
  if (!base) base = '__unknown__';
  return `${base}:${hash}`;
}

export function parseTemplateKey(key: string): { sender: string; hash: string } {
  if (key.includes(':')) {
    const [sender, hash] = key.split(':');
    return { sender, hash };
  }
  return { sender: '__unknown__', hash: key };
}

// ============================================================================
// SECTION: Template Bank CRUD
// PURPOSE: Load/save template bank with legacy migration support
// REVIEW: Three migration paths handled (null, legacy array, legacy keyed)
// ============================================================================

/**
 * Load template bank from storage with automatic migration.
 * Handles three storage formats:
 * 1. New keyed format: Record<string, SmartPasteTemplate>
 * 2. Legacy array format: SmartPasteTemplate[]
 * 3. Fresh install: null
 * 
 * @returns Template bank keyed by sender:hash
 * @side-effects Persists migrated format back to storage
 */
export function loadTemplateBank(): Record<string, SmartPasteTemplate> {
  let raw = safeStorage.getItem(TEMPLATE_BANK_KEY);
  let bank: any = raw ? JSON.parse(raw) : null;

  if (!bank) {
    const legacy = safeStorage.getItem('xpensia_structure_templates');
    if (legacy) {
      const arr = JSON.parse(legacy) as SmartPasteTemplate[];
      bank = {} as Record<string, SmartPasteTemplate>;
      if (Array.isArray(arr)) {
        arr.forEach(t => {
          const key = getTemplateKey(undefined, undefined, t.id);
          bank[key] = t;
        });
      }
      safeStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(bank));
    } else {
      bank = {};
    }
  }

  if (Array.isArray(bank)) {
    const converted: Record<string, SmartPasteTemplate> = {};
    bank.forEach((t: SmartPasteTemplate) => {
      const key = getTemplateKey(undefined, undefined, t.id);
      converted[key] = t;
    });
    bank = converted;
    safeStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(bank));
  }

  // Ensure meta defaults for backward compatibility
  Object.values(bank).forEach((t: SmartPasteTemplate) => {
    ensureTemplateMeta(t);
  });
  safeStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(bank));

  console.log('[loadTemplateBank] Retrieved bank:', bank);

  return bank as Record<string, SmartPasteTemplate>;
}

export function saveTemplateBank(templates: Record<string, SmartPasteTemplate>) {
  safeStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(templates));
}

/**
 * Get a template by hash, with sender-scoped lookup.
 * Falls back to unknown sender if scoped lookup fails.
 * 
 * @param hash - Template structure hash
 * @param sender - Optional sender for scoped lookup
 * @param fromAccount - Optional account fallback
 * @returns Template if found, undefined otherwise
 * @side-effects Updates lastUsedAt and usageCount on hit
 */
export function getTemplateByHash(
  hash: string,
  sender?: string,
  fromAccount?: string
): SmartPasteTemplate | undefined {
  const templates = loadTemplateBank();
  const key = getTemplateKey(sender, fromAccount, hash);
  let foundKey = key;
  let template = templates[key];
  if (!template) {
    foundKey = getTemplateKey(undefined, undefined, hash);
    template = templates[foundKey];
  }
  if (template) {
    ensureTemplateMeta(template);
    template.meta.lastUsedAt = new Date().toISOString();
    template.meta.usageCount = (template.meta.usageCount || 0) + 1;
    templates[foundKey] = template;
    saveTemplateBank(templates);
  }
  return template;
}

/**
 * Save a new template or update existing one's fields.
 * 
 * @param template - Normalized template structure string
 * @param fields - List of detected field names
 * @param rawMessage - Original SMS message for debugging
 * @param sender - SMS sender identifier
 * @param fromAccount - Account identifier
 * @returns Template ID (base64 hash of structure)
 */
export function saveNewTemplate(
  template: string,
  fields: string[],
  rawMessage?: string,
  sender?: string,
  fromAccount?: string
) {
  const templates = loadTemplateBank();
  const id = btoa(unescape(encodeURIComponent(template))).slice(0, 24);
  const key = getTemplateKey(sender, fromAccount, id);

  if (!templates[key]) {
    templates[key] = {
      id,
      template,
      fields,
      defaultValues: {},
      created: new Date().toISOString(),
      rawSample: rawMessage || '',
      version: 'v2',
      hashAlgorithm: 'SHA256',
      meta: {
        createdAt: new Date().toISOString(),
        usageCount: 0,
        successCount: 0,
        fallbackCount: 0,
      }
    };
  } else {
    templates[key].fields = [...new Set([...templates[key].fields, ...fields])];
    if (rawMessage) templates[key].rawSample = rawMessage;
  }

  saveTemplateBank(templates);
  return id;
}

export function getAllTemplates(): SmartPasteTemplate[] {
  return Object.values(loadTemplateBank());
}

/**
 * Find templates unused for more than threshold days.
 * Used for template health dashboard and cleanup.
 * 
 * @param bank - Template bank to scan
 * @param thresholdDays - Staleness threshold (default 90)
 * @returns Array of stale templates
 */
export function getStaleTemplates(
  bank: Record<string, SmartPasteTemplate>,
  thresholdDays = 90
): SmartPasteTemplate[] {
  const now = Date.now();
  return Object.values(bank).filter(t => {
    const last = t.meta?.lastUsedAt
      ? new Date(t.meta.lastUsedAt).getTime()
      : 0;
    return now - last > thresholdDays * 86400000;
  });
}

// ============================================================================
// SECTION: Template Structure Extraction
// PURPOSE: Convert raw SMS to template with placeholders
// REVIEW: Regex patterns must handle Arabic text and various date formats
// @review-risk: Complex regex - test with diverse SMS samples
// ============================================================================

/**
 * Extract template structure from a raw SMS message.
 * Replaces detected fields with placeholders ({{amount}}, {{date}}, etc.)
 * 
 * @param message - Raw SMS text
 * @returns structure (template string), placeholders (extracted values), hash
 * 
 * @review-focus
 * - Amount+currency regex handles: SAR 55,100.00 | 35 SAR | 200.00 ر.س | جنيه مصري
 * - Date regex handles: dd/MM/yy, yyyy-MM-dd, dd-MMM-yyyy, etc.
 * - Vendor extraction strips trailing date patterns
 */
export function extractTemplateStructure(
  message: string
): { structure: string; placeholders: Record<string, string>; hash: string } {
  const patterns = [
   {
	  // Support formats like: SAR 55,100.00 | 35 SAR | 200.00 ر.س | ٣٥٠ جنيه مصري
	  regex: /(?:مبلغ[:\s]*)?(?:(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه)[\s:]?((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)|((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)[\s:]?(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه))/gi,
	  fieldName: 'amount+currency'
	},
    {
      regex: new RegExp(
        String.raw`(?:في[:\s]*)?(?:on\s*)?(` +
        [
          String.raw`\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{1,4}`, // Updated: allow short year like 25-5-3
          String.raw`\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}`,
          String.raw`\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4}`,
          String.raw`\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}`,
          String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}`,
          String.raw`\d{2}[01]\d{3}`,
          String.raw`\d{8}`
        ].join('|') +
        String.raw`)(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?`,
        'gi'
      ),
      fieldName: 'date'
    },
    {
      regex: /\*{2,4}\d{3,4}/g,
      fieldName: 'account'
    }
  ];

  let templateText = message;
  const placeholders: Record<string, string> = {};
  const replacements: { start: number; end: number; replacement: string }[] = [];

  // Extract vendor using extractVendorName from suggestionEngine.ts
  const vendor = extractVendorName(message);
  if (vendor) {
    placeholders['vendor'] = vendor;
    const vendorIndex = message.indexOf(vendor);
    if (vendorIndex !== -1) {
      replacements.push({
        start: vendorIndex,
        end: vendorIndex + vendor.length,
        replacement: `{{vendor}}`
      });
    }
  }

  for (const { regex, fieldName } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(message)) !== null) {
      const fullMatch = match[0];

      if (fieldName === 'amount+currency') {
        let amount = '';
        let currency = '';

        if (match[1] && match[2]) {
          currency = match[1];
          amount = match[2];
        } else if (match[3] && match[4]) {
          amount = match[3];
          currency = match[4];
        }

        if (!placeholders.amount && !placeholders.currency && amount && currency) {
          const numericAmount = amount.replace(/,/g, '');
          placeholders.amount = numericAmount;
          // Normalize currency code to handle Arabic names like 'جنيه' -> 'EGP'
          placeholders.currency = normalizeCurrencyCode(currency);
          replacements.push({
            start: match.index,
            end: match.index + fullMatch.length,
            replacement: `{{currency}} {{amount}}`
          });
        }
      } else {
        const valueGroup = match[1] || fullMatch;
        if (!placeholders[fieldName]) {
          placeholders[fieldName] = valueGroup.trim();
          replacements.push({
            start: match.index,
            end: match.index + fullMatch.length,
            replacement: `{{${fieldName}}}`
          });
        }
      }

      break; // Only take the first match for each field
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  for (const { start, end, replacement } of replacements) {
    templateText = templateText.slice(0, start) + replacement + templateText.slice(end);
  }

  const { structure, hash } = normalizeTemplateStructure(templateText.trim());
  return { structure, placeholders, hash };
}

// ============================================================================
// SECTION: Template Failure Tracking
// PURPOSE: Track parsing failures to auto-flag templates for retraining
// REVIEW: Threshold-based persistence to avoid storage spam
// ============================================================================

interface TemplateFailureRecord {
  hash: string;
  sender?: string;
  rawMessage: string;
  expectedStructure: string;
  timestamp: number;
}

const TEMPLATE_FAILURE_KEY = 'xpensia_template_failures';
const FAILURE_THRESHOLD = 3;

// In-memory map of template failures in this session
const templateFailureMap: Record<string, number> = {};

/**
 * Increment failure count for a template.
 * Persists to storage when threshold is reached.
 * 
 * @param hash - Template hash
 * @param sender - SMS sender
 * @param rawMessage - Failed message for debugging
 * @param expectedStructure - What we expected to parse
 * @side-effects Writes to xpensia_template_failures after N failures
 */
export function incrementTemplateFailure(
  hash: string,
  sender: string | undefined,
  rawMessage: string,
  expectedStructure: string
) {
  const key = getTemplateKey(sender, undefined, hash);
  templateFailureMap[key] = (templateFailureMap[key] || 0) + 1;
  if (templateFailureMap[key] >= FAILURE_THRESHOLD) {
    const existing: TemplateFailureRecord[] = JSON.parse(
      safeStorage.getItem(TEMPLATE_FAILURE_KEY) || '[]'
    );
    existing.push({
      hash,
      sender,
      rawMessage,
      expectedStructure,
      timestamp: Date.now(),
    });
    safeStorage.setItem(TEMPLATE_FAILURE_KEY, JSON.stringify(existing));
  }
}

export function getTemplateFailureCount(
  hash: string,
  sender?: string
): number {
  const key = getTemplateKey(sender, undefined, hash);
  return templateFailureMap[key] || 0;
}
