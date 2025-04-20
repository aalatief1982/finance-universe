// templateUtils.ts

/**
 * Handles saving, retrieving, and managing Smart Paste templates in localStorage.
 * Each template maps a message structure to field placeholders (e.g., {amount}, {date}, {vendor})
 */

const STORAGE_KEY = 'xpensia_structure_templates';

export interface SmartPasteTemplate {
  id: string; // Template hash
  template: string;
  fields: string[];
  defaultValues?: {
    type?: string;
    fromAccount?: string;
    category?: string;
    subcategory?: string;
    currency?: string;
    vendor?: string;
  };
  rawExample?: string;
  createdAt: string;
}

/** Load all stored templates */
export function getAllTemplates(): SmartPasteTemplate[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/** Get template by hash */
export function getTemplateByHash(hash: string): SmartPasteTemplate | undefined {
  const templates = getAllTemplates();
  const match = templates.find(t => t.id === hash);
  console.log('[SmartPaste] Template match check result:', match);
  return match;
}

/**
 * Parses a raw message and replaces dynamic fields with placeholders.
 * Returns the normalized template and extracted dynamic values.
 */
export function extractTemplateStructure(raw: string): {
  template: string;
  placeholders: Record<string, string>;
} {
  let result = raw;

  const placeholders: Record<string, string> = {};

  // Match Amount + Currency (SAR 123.45, USD 10, etc.)
		const amountMatch = raw.match(/(?:SAR|USD|EGP|BHD|AED)\s?(\d{1,6}(?:[.,]\d{1,2})?)/i);
		if (amountMatch) {
		  placeholders.amount = parseFloat(String(amountMatch[1]).replace(',', '.')).toFixed(2);
		  placeholders.currency = amountMatch[0].match(/[A-Z]{3}/)?.[0] || 'SAR';
		  result = result.replace(amountMatch[0], '{currency} {amount}');
		}

  // Match Date (2025-04-17, 17/04/2025, etc.)
  const dateMatch = raw.match(/\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}/);
  if (dateMatch) {
    placeholders.date = dateMatch[0];
    result = result.replace(dateMatch[0], '{date}');
  }

		// Match vendor after 'لدى' or 'في' up to the next line
		const vendorMatch = raw.match(/(?:لدى|في)[:\s]+(.+?)(?:\n|$)/i);
		if (vendorMatch) {
		  placeholders.vendor = vendorMatch[1].trim();
		  result = result.replace(vendorMatch[0], vendorMatch[0].replace(vendorMatch[1], '{vendor}'));
		}


  // Match account (card ending with ***1234 or similar)
  const accountMatch = raw.match(/(?:\*{2,4}\d{3,4})|(?:\d{4} ?\d{4} ?\d{4} ?\d{4})/);
  if (accountMatch) {
    placeholders.account = accountMatch[0];
    result = result.replace(accountMatch[0], '{account}');
  }

  return {
    template: result.trim(),
    placeholders
  };
}

export function loadTemplateBank(): SmartPasteTemplate[] {
  const raw = localStorage.getItem('xpensia_structure_templates');
  return raw ? JSON.parse(raw) : [];
}

export function saveTemplateBank(templates: SmartPasteTemplate[]) {
  localStorage.setItem('xpensia_structure_templates', JSON.stringify(templates));
}

/** Save a new template if not already stored */
export function saveNewTemplate(template: string, fields: string[], rawExample?: string): void {
  const hash = btoa(unescape(encodeURIComponent(template))).slice(0, 24); // basic hash
  const templates = getAllTemplates();
  const exists = templates.some(t => t.id === hash);
  if (exists) {
    console.log('[SmartPaste] Template already exists, not saving.');
    return;
  }

  const newTemplate: SmartPasteTemplate = {
    id: hash,
    template,
    fields,
    rawExample,
    createdAt: new Date().toISOString(),
  };

  const updated = [...templates, newTemplate];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  console.log('[SmartPaste] Saved new template:', newTemplate);
}
