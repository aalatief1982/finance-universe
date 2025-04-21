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
	if (!rawMessage) {
    throw new Error('Empty message passed to extractTemplateStructure');
  }
  let template = '';
  let placeholders = {};
  try {
    const result = extractTemplateStructure(rawMessage);
    template = result.template;
    placeholders = result.placeholders;
	
	if (!template) throw new Error('Extracted template is empty');
	if (!placeholders) throw new Error('Extracted placeholders are missing');
	
  } catch (err) {
    console.error('[SmartPaste] ❌ extractTemplateStructure failed:', err);
    throw err; // Let upstream handler deal with it
  }

  const templateHash = simpleHash(template);
  console.log('[SmartPaste] Step 2: Extracted Template:', template);
  console.log('[SmartPaste] Step 3: Template Hash:', templateHash);

  const matchedTemplate = getTemplateByHash(templateHash);
  const directFields: Record<string, string> = {};

  if (matchedTemplate) {
    matchedTemplate.fields.forEach(field => {
	  const value = placeholders[field];
	  if (value) {
		directFields[field] = value;
	  } else {
		console.warn(`[SmartPaste] Missing placeholder value for ${field}`);
	  }
	});

    if (matchedTemplate.defaultValues) {
      Object.entries(matchedTemplate.defaultValues).forEach(([key, value]) => {
        if (!directFields[key]) {
          directFields[key] = value;
        }
      });
    }
  }
  else {
  // ✅ FIRST-TIME message – use raw extracted values
  Object.entries(placeholders).forEach(([key, value]) => {
    directFields[key] = value;
  });
}

  const inferred = inferIndirectFields(rawMessage, directFields);
  console.log('[SmartPaste] Step 5: Inferred fields:', inferred);
  console.log('[SmartPaste] Final directFields:', directFields);

  return {
    rawMessage,
    template,
    templateHash,
    matched: !!matchedTemplate,
    directFields,
    inferredFields: inferred,
    defaultValues: matchedTemplate?.defaultValues || {}
  };
}



function applyVendorMapping(vendor: string): string {
  const map = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] || vendor;
}
