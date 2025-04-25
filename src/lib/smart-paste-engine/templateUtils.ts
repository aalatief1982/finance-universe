
import { SmartPasteTemplate } from '@/types/template';

export function loadTemplateBank(): SmartPasteTemplate[] {
  const raw = localStorage.getItem('xpensia_structure_templates');
  return raw ? JSON.parse(raw) : [];
}

export function saveTemplateBank(templates: SmartPasteTemplate[]) {
  localStorage.setItem('xpensia_structure_templates', JSON.stringify(templates));
}

export function getTemplateByHash(hash: string): SmartPasteTemplate | undefined {
  const templates = loadTemplateBank();
  return templates.find(t => t.id === hash);
}

export function saveNewTemplate(template: string, fields: string[], rawMessage?: string) {
  const templates = loadTemplateBank();
  const id = btoa(unescape(encodeURIComponent(template))).slice(0, 24);
  
  const existingIndex = templates.findIndex(t => t.id === id);
  
  if (existingIndex === -1) {
    templates.push({
      id,
      template,
      fields,
      defaultValues: {},
      created: new Date().toISOString(),
      rawSample: rawMessage || ''
    });
  } else {
    // Update existing template
    templates[existingIndex].fields = [...new Set([...templates[existingIndex].fields, ...fields])];
    if (rawMessage) {
      templates[existingIndex].rawSample = rawMessage;
    }
  }
  
  saveTemplateBank(templates);
  return id;
}

export function getAllTemplates(): SmartPasteTemplate[] {
  return loadTemplateBank();
}
export function extractTemplateStructure(
  message: string
): { template: string; placeholders: Record<string, string> } {
  const patterns = [
    // Amount + currency like SAR 45.00
    {
      regex: /\b(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD)\s?(\d{1,4}(?:[.,]\d{2})?)\b/gi,
      fieldName: 'amount+currency'
    },

    // Extended date formats (25-04-23, 25/4/23, etc.)
   {
	  regex: /\b(?:on\s*)?((\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}))(\s*\d{1,2}:\d{2})?/gi,
	  fieldName: 'date'
	}
,

    // Vendor after "لدى:"
    {
      regex: /لدى:?\s*([^\n]+)/gi,
      fieldName: 'vendor'
    },

    // Account/card pattern (optional)
    {
      regex: /\*{2,4}\d{3,4}/g,
      fieldName: 'account'
    },
  ];

  let templateText = message;
  const placeholders: Record<string, string> = {};
  const replacements: { start: number; end: number; replacement: string }[] = [];

  for (const { regex, fieldName } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(message)) !== null) {
      const fullMatch = match[0];

      if (fieldName === 'amount+currency') {
        const [currency, amount] = [match[1], match[2]];
        if (!placeholders.amount && !placeholders.currency) {
          placeholders.amount = amount;
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

      break; // one match per field
    }
  }

  // Replace from end to start to avoid shifting indexes
  replacements.sort((a, b) => b.start - a.start);
  for (const { start, end, replacement } of replacements) {
    templateText = templateText.slice(0, start) + replacement + templateText.slice(end);
  }

  return { template: templateText.trim(), placeholders };
}


