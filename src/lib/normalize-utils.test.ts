import { describe, expect, it } from 'vitest';
import { isRTL, normalizeNumerals, normalizePunctuation } from './normalize-utils';

describe('normalizeNumerals', () => {
  it('converts Arabic-Indic digits to Western digits', () => {
    expect(normalizeNumerals('المجموع ١٢٣')).toBe('المجموع 123');
  });

  it('converts Eastern Arabic digits to Western digits', () => {
    expect(normalizeNumerals('عدد ۴۵۶')).toBe('عدد 456');
  });

  it('leaves Western digits unchanged', () => {
    expect(normalizeNumerals('Total 789')).toBe('Total 789');
  });
});

describe('normalizePunctuation', () => {
  it('normalizes Arabic punctuation to ASCII equivalents', () => {
    const input = 'مرحباً، هل هذا صحيح؟ “نعم”؛ بالطبع.';
    const expected = 'مرحباً, هل هذا صحيح? "نعم"; بالطبع.';
    expect(normalizePunctuation(input)).toBe(expected);
  });

  it('keeps ASCII punctuation intact', () => {
    const input = 'Paid $20, on 2024-02-01.';
    expect(normalizePunctuation(input)).toBe(input);
  });
});

describe('isRTL', () => {
  it('detects RTL scripts', () => {
    expect(isRTL('مرحبا بالعالم')).toBe(true);
  });

  it('returns false for LTR scripts', () => {
    expect(isRTL('Hello world')).toBe(false);
  });
});
