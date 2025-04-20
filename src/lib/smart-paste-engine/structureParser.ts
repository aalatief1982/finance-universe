// structureParser.ts

/**
 * Parses a raw SMS using structure-template-first approach.
 * Matches existing templates or builds new ones; returns structured transaction data.
 */

import { extractTemplateStructure, getTemplateByHash, saveNewTemplate } from './templateUtils';
import { inferIndirectFields } from './suggestionEngine';

// Hashing util (replace with real hash lib if needed)
const simpleHash = (text: string) => btoa(unescape(encodeURIComponent(text))).slice(0, 24);

export function parseSmsMessage(rawMessage: string) {
  console.log('[SmartPaste] Step 1: Received raw message:', rawMessage);

  // Extract template and placeholder format
  const { template, placeholders } = extractTemplateStructure(rawMessage);
  const templateHash = simpleHash(template);

  console.log('[SmartPaste] Step 2: Extracted Template:', template);
  console.log('[SmartPaste] Step 3: Template Hash:', templateHash);

  const matchedTemplate = getTemplateByHash(templateHash);
  const directFields = {};
  
  
if (matchedTemplate) {
  // Extract values from message
  matchedTemplate.fields.forEach(field => {
    directFields[field] = placeholders[field];
  });

  // Then fill in default values not found in the message
  if (matchedTemplate.defaultValues) {
    Object.entries(matchedTemplate.defaultValues).forEach(([key, value]) => {
      if (!directFields[key]) {
        directFields[key] = value;
      }
    });
  }
}



  // Infer type, category, fromAccount, subcategory from text
  const inferred = inferIndirectFields(rawMessage, directFields);
  console.log('[SmartPaste] Step 5: Inferred fields:', inferred);

  return {
    rawMessage,
    template,
    templateHash,
    matched: !!matchedTemplate,
    directFields,
    inferredFields: inferred,
  };
}


function applyVendorMapping(vendor: string): string {
  const map = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] || vendor;
}
