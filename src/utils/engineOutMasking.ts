const PHONE_PATTERN = /(\+?\d[\d\s\-()]{7,}\d)/g;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

const simpleHash = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
};

export const maskPhoneNumber = (value?: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7) return value;
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
};

export const maskCardDigits = (value?: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 12) return value;
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
};

export const maskRawSms = (value?: string): string => {
  if (!value) return '';
  const preview = value.slice(0, 20);
  return `${preview}… [hash:${simpleHash(value)}]`;
};

export const maskSensitiveText = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(PHONE_PATTERN, (match) => maskPhoneNumber(match))
    .replace(CARD_PATTERN, (match) => maskCardDigits(match));
};

export const displaySensitiveText = (value: string | undefined, showRaw: boolean): string => {
  if (!value) return '';
  return showRaw ? value : maskSensitiveText(value);
};
