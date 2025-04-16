
// 📁 Path: src/lib/structure-extractor.ts (🆕 New)

import { StructureExtractionResult } from "../types/structure";
import { hashString } from "./utils/hash";

/**
 * A collection of regex patterns for extracting common transaction fields.
 * Each regex targets a specific data point like amount, date, vendor, etc.
 */
const regexMap = {
  amount: /(SAR|EGP|USD|BHD|AED)?\s?([0-9]+(?:\.[0-9]{1,2})?)/i,
  currency: /(SAR|EGP|USD|BHD|AED)/i,
  date: /\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?/, // ISO date or datetime
  vendor: /لدى[:\s]?([\w\s\d×\-_.]+)/i,
  fromAccount: /بطاقة[:\s*]?\*{0,3}(\d{3,4})/i
};

/**
 * Extracts a normalized structure from raw message text.
 * Replaces identified fields with placeholders to create a message template.
 */
export function extractStructure(raw: string): StructureExtractionResult {
  console.log("[structure-extractor] Extracting structure from raw message:", raw.substring(0, 50) + "...");
  
  const placeholders = {
    amount: "{amount}",
    currency: "{currency}",
    vendor: "{vendor}",
    date: "{date}",
    fromAccount: "{fromAccount}"
  };

  const detectedFields: any = {};
  let structure = raw;

  for (const field in regexMap) {
    const match = raw.match(regexMap[field as keyof typeof regexMap]);
    if (match) {
      const value = field === "amount" && match[2] ? parseFloat(match[2]) : match[1] || match[0];
      detectedFields[field] = { value, source: "regex" };
      structure = structure.replace(match[0], placeholders[field as keyof typeof placeholders]);
      
      console.log(`[structure-extractor] Detected ${field}:`, value);
    }
  }

  const hash = hashString(structure);
  console.log("[structure-extractor] Generated hash:", hash);
  console.log("[structure-extractor] Detected fields:", Object.keys(detectedFields));

  return {
    structure,
    hash,
    detectedFields
  };
}
