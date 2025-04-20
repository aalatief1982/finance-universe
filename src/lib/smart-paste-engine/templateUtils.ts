
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
    // Amount patterns
    { regex: /\b(\d{1,3}(,\d{3})*(\.\d{1,2})?)\b/g, fieldName: 'amount' },
    { regex: /[\$\€\£\¥](\d{1,3}(,\d{3})*(\.\d{1,2})?)/g, fieldName: 'amount' },
    
    // Date patterns
    { regex: /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g, fieldName: 'date' },
    { regex: /\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g, fieldName: 'date' },
    
    // Currency patterns
    { regex: /\b(USD|SAR|EUR|GBP|AED|JPY|CNY|INR|CAD|AUD)\b/g, fieldName: 'currency' },
    
    // Account patterns
    { regex: /(?:account|acct|acc)[:\s]*([A-Za-z0-9*\s]{4,})/gi, fieldName: 'account' },
    { regex: /([A-Za-z]+ (?:account|card))/gi, fieldName: 'account' },
    
    // Vendor patterns (common business names)
    { regex: /(?:at|from|to)\s+([A-Za-z0-9\s&]{2,20})\b/gi, fieldName: 'vendor' },
    { regex: /\b(?:purchase|payment|transaction|paid)\s+(?:at|from|to)\s+([A-Za-z0-9\s&]{2,20})\b/gi, fieldName: 'vendor' },
    
    // Card number patterns
    { regex: /(?:card\s+x+|card\s+ending\s+in\s+|card\s+\*+)([0-9]{4})/gi, fieldName: 'cardEnding' },
  ];
  
  let templateText = message;
  const placeholders: Record<string, string> = {};
  
  // Process each pattern
  patterns.forEach(({ regex, fieldName }) => {
    regex.lastIndex = 0; // Reset regex state
    let match;
    while ((match = regex.exec(message)) !== null) {
      const fullMatch = match[0];
      const valueGroup = match[1] || fullMatch;
      
      // Skip if this exact value was already captured for this field
      if (placeholders[fieldName] === valueGroup) continue;
      
      // Store the captured value
      placeholders[fieldName] = valueGroup;
      
      // Replace the matched text with a placeholder in the template
      templateText = templateText.replace(fullMatch, `{{${fieldName}}}`);
      
      // Reset regex after replacement as the string has changed
      regex.lastIndex = 0;
    }
  });
  
  return { template: templateText, placeholders };
}
