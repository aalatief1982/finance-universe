export function normalizeNumerals(text: string): string {
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return text.replace(/[٠-٩۰-۹]/g, d => map[d] || d);
}

export function normalizePunctuation(text: string): string {
  const map: Record<string, string> = {
    '،': ',',
    '؛': ';',
    '؟': '?',
    '«': '"',
    '»': '"',
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'"
  };
  return text.replace(/[،؛؟«»“”‘’]/g, c => map[c] || c);
}

export function isRTL(text: string): boolean {
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}
