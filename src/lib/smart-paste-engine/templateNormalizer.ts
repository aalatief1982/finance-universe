export function normalizeTemplateStructure(text: string): string {
  if (!text) return '';
  let normalized = text;
  const replacements: Record<string, string> = {
    '‘': "'",
    '’': "'",
    '‚': "'",
    '“': '"',
    '”': '"',
    '„': '"',
    '–': '-',
    '—': '-',
    '−': '-',
    '…': '...',
  };
  for (const [smart, plain] of Object.entries(replacements)) {
    normalized = normalized.split(smart).join(plain);
  }
  const eastern = '٠١٢٣٤٥٦٧٨٩';
  normalized = normalized.replace(/[\u0660-\u0669]/g, d => String(eastern.indexOf(d)));
  normalized = normalized.replace(/[\s\x00-\x1F]+/g, '');
  return normalized;
}
