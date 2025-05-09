
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
    {
      // Support formats: SAR 55,100.00 | 35 SAR | SAR 35
      regex: /(?:مبلغ[:\s]*)?(?:(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD)[\s:]?((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)|((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)[\s:]?(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD))/gi,
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
		  regex: /(?:لدى|من|في|عند|من عند|تم الدفع لـ|تم الشراء من|at|from|paid to|purchased from)[:\s]*([^\n,؛;:\-]+)/gi,
		  fieldName: 'vendor'
		},
    {
      regex: /\*{2,4}\d{3,4}/g,
      fieldName: 'account'
    }
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

  return { template: templateText.trim(), placeholders };
}
