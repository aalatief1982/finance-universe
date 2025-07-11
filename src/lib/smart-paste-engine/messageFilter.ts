export function isFinancialTransactionMessage(text: string): boolean {
  let storedKeywords: string[] = [];

  try {
    const raw = localStorage.getItem('xpensia_type_keywords');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        storedKeywords = parsed;
      } else {
        if (import.meta.env.MODE === 'development') {
          console.warn('[MessageFilter] Invalid xpensia_type_keywords format:', parsed);
        }
      }
    }
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.warn('Failed to parse xpensia_type_keywords:', e);
    }
  }

  const fallbackKeywords = ["مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع"];
  const financialKeywords = storedKeywords.length > 0 ? storedKeywords : fallbackKeywords;

  const normalize = (str: any): string =>
    typeof str === 'string'
      ? str.normalize('NFC').replace(/\s+/g, '').trim().toLowerCase()
      : '';

  const normalizedText = normalize(text);

  const keywordMatch = financialKeywords.some(keyword =>
    normalizedText.includes(normalize(keyword))
  );

  const currencyAmountRegex = /(?:مبلغ[:\s]*)?(?:(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه)[\s:]?((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)|((?:\d{1,3},)*\d{1,3}(?:[.,]\d{0,2})?)[\s:]?(SAR|USD|EGP|AED|BHD|EUR|GBP|JPY|INR|CNY|CAD|AUD|ر\.?\s?س|ريال|جنيه\s?مصري|جنيه))/gi;
  const amountMatch = currencyAmountRegex.test(text);

  const dateRegex = new RegExp(
    String.raw`(?:في[:\s]*)?(?:on\s*)?(` +
    [
      String.raw`\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{1,4}`,
      String.raw`\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}`,
      String.raw`\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4}`,
      String.raw`\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}`,
      String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}`,
      String.raw`\d{2}[01]\d{3}`,
      String.raw`\d{8}`
    ].join('|') +
    String.raw`)(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?`,
    'gi'
  );
  const dateMatch = dateRegex.test(text);


  return keywordMatch && amountMatch && dateMatch;
}
