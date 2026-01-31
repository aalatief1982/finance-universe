/**
 * @file TemplateStructureService.ts
 * @description Generates template structures from raw SMS text by
 *              replacing detected entities with placeholders.
 *
 * @module services/TemplateStructureService
 *
 * @responsibilities
 * 1. Normalize amounts, currency, date, and account tokens into placeholders
 * 2. Return template string plus detected field list
 *
 * @review-tags
 * - @risk: regex replacements may overlap or miss tokens
 *
 * @review-checklist
 * - [ ] Placeholder list matches applied replacements
 * - [ ] Field list is de-duplicated
 */

export const TemplateStructureService = {
  generateTemplateStructure(text: string): {
    template: string;
    fields: string[];
  } {
    const replacements = [
      { key: 'amount', regex: /\b\d{1,3}(,\d{3})*(\.\d+)?\b/g },
      { key: 'currency', regex: /\b(SAR|EGP|USD|AED|EUR)\b/gi },
      { key: 'date', regex: /\d{4}-\d{2}-\d{2}/g },
      { key: 'time', regex: /\d{2}:\d{2}:\d{2}/g },
      { key: 'account', regex: /\*{2,}\d{2,}/g },
      // Add common banking phrases
      { key: 'transactionType', regex: /\b(payment|purchase|withdrawal|deposit|transfer|شراء|سحب|إيداع|تحويل)\b/gi },
      { key: 'vendor', regex: /\bledy: ([^;]+)[;:]/i }, // For "لدى:" pattern
    ];

    let result = text;
    const fields: string[] = [];

    for (const rule of replacements) {
      if (rule.regex.test(result)) {
        result = result.replace(rule.regex, `{${rule.key}}`);
        fields.push(rule.key);
      }
    }

    return {
      template: result,
      fields: [...new Set(fields)]
    };
  }
};
