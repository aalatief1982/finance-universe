import { extractVendorName } from './suggestionEngine';
import { SmartPasteTemplate } from '@/types/template';
import { normalizeTemplateStructure } from './templateNormalizer';
import { sha256 } from './sha256';

const TEMPLATE_BANK_KEY = 'xpensia_template_bank';

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

export function loadTemplateBank(): Record<string, SmartPasteTemplate> {
  let raw = localStorage.getItem(TEMPLATE_BANK_KEY);
  let bank: any = raw ? JSON.parse(raw) : null;

  if (!bank) {
    const legacy = localStorage.getItem('xpensia_structure_templates');
    if (legacy) {
      const arr = JSON.parse(legacy) as SmartPasteTemplate[];
      bank = {} as Record<string, SmartPasteTemplate>;
      if (Array.isArray(arr)) {
        arr.forEach(t => {
          const key = getTemplateKey(undefined, undefined, t.id);
          bank[key] = t;
        });
      }
      localStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(bank));
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
    localStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(bank));
  }

  // Ensure legacy entries without version/hashAlgorithm remain untouched
  Object.values(bank || {}).forEach((t: any) => {
    if (t.structure && (!t.structure.version || !t.structure.hashAlgorithm)) {
      // legacy entry - do not modify
    }
  });

  return bank as Record<string, SmartPasteTemplate>;
}

export function saveTemplateBank(templates: Record<string, SmartPasteTemplate>) {
  localStorage.setItem(TEMPLATE_BANK_KEY, JSON.stringify(templates));
}

export function getTemplateByHash(
  hash: string,
  sender?: string,
  fromAccount?: string
): SmartPasteTemplate | undefined {
  const templates = loadTemplateBank();
  const key = getTemplateKey(sender, fromAccount, hash);
  return templates[key] || templates[getTemplateKey(undefined, undefined, hash)];
}

export function saveNewTemplate(
  template: string,
  fields: string[],
  rawMessage?: string,
  sender?: string,
  fromAccount?: string
) {
  const templates = loadTemplateBank();
  const normalized = normalizeTemplateStructure(template);
  const id = sha256(normalized);
  const key = getTemplateKey(sender, fromAccount, id);

  if (!templates[key]) {
    templates[key] = {
      id,
      template,
      fields,
      defaultValues: {},
      created: new Date().toISOString(),
      rawSample: rawMessage || '',
      structure: {
        structure: normalized,
        hash: id,
        version: 'v2',
        hashAlgorithm: 'SHA256'
      }
    } as any;
  } else {
    templates[key].fields = [...new Set([...templates[key].fields, ...fields])];
    if (rawMessage) templates[key].rawSample = rawMessage;
    if (!templates[key].structure) {
      (templates[key] as any).structure = {
        structure: normalized,
        hash: id,
        version: 'v2',
        hashAlgorithm: 'SHA256'
      };
    }
  }

  saveTemplateBank(templates);
  return id;
}

export function getAllTemplates(): SmartPasteTemplate[] {
  return Object.values(loadTemplateBank());
}

export function extractTemplateStructure(
  message: string
): { template: string; placeholders: Record<string, string>; normalized: string } {
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
          String.raw`\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{1,4}`,
          String.raw`\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}`,
          String.raw`\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4}`,
          String.raw`\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}`,
          String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}`,
          String.raw`\d{2}[01]\d{3}`,
          String.raw`\d{8}`
        ].join('|') +
        String.raw`)(?:\s+\d{1,2}:\d{2}(?::\d{2})?)`,
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
          placeholders.currency = currency;
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

  const trimmed = templateText.trim();
  const normalized = normalizeTemplateStructure(trimmed);
  return { template: trimmed, placeholders, normalized };
}
