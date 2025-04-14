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
  