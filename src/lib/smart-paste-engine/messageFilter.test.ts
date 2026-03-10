import { describe, expect, it, beforeEach } from 'vitest';
import { isFinancialTransactionMessage } from './messageFilter';

const baseMessage = 'Deposit of SAR 1,234 on 2024-02-01';

describe('isFinancialTransactionMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns true when keyword, amount, and date are present', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    expect(isFinancialTransactionMessage(baseMessage)).toBe(true);
  });

  it('returns false when the date is missing', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    expect(isFinancialTransactionMessage('Deposit of SAR 1,234 yesterday')).toBe(false);
  });

  it('falls back to default keywords when stored keywords are malformed', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify({ expense: ['purchase'] }));
    const message = 'تم تحويل SAR 250 في 2024-01-02';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('returns false when amount is missing even if keyword and date exist', () => {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(['deposit']));
    const message = 'Deposit completed on 2024-02-01';
    expect(isFinancialTransactionMessage(message)).toBe(false);
  });

  it('passes HSBC compact date (DDMonYY) with English keyword', () => {
    // Uses fallback keywords — "payment" is now in the enriched fallback list
    const message = 'From HSBC: 09MAR26 Internet Banking TT Payment from 045-076***-001 EGP 551,393.00- Your available balance is EGP 329,306.55';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('passes international transfer with Arabic keywords and standard date', () => {
    const message = 'حوالة صادرة: دولية\nدولة: EGYPT\nمن: ***001 احمد عبد الرحمن\nإلى: 110 Ahmed Abdellatief HSBC USD\nمبلغ: 56,325.00 SAR\nالرسوم: 57.50\nفي: 2026-03-08 11:22:36';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('continues passing standard Arabic purchase SMS', () => {
    const message = 'شراء عبر نقاط البيع\nباستخدام بطاقة الأول VISA My Card الائتمانية (0275) لدى bolt.eu بمبلغ SAR 29.00 في 2026-03-08 19:43:38\nالرصيد: SAR 75.62';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('continues passing short Arabic purchase with short date', () => {
    const message = 'شراء\nعبر:3965;مدى-سامسونج باي\nبـSAR 4\nلـSaba Restaurant\n26/3/10 23:49';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('accepts mixed Arabic+Latin transaction format with semicolons and merchant prefix', () => {
    const message = 'شراء عبر نقاط البيع\nعبر:3965;mada-apple pay\nبـSAR 128.75\nلـMerchant Roasters\n26/3/10 23:49';
    expect(isFinancialTransactionMessage(message)).toBe(true);
  });

  it('rejects promotional SMS without transaction signal', () => {
    const message = 'احصل على خصم 50% على جميع المنتجات! تسوق الآن';
    expect(isFinancialTransactionMessage(message)).toBe(false);
  });

  it('rejects OTP controls even when mixed financial-like tokens are present', () => {
    const message = 'رمز التحقق: 889911\nشراء عبر:3965;mada\nبـSAR 120\nلـMerchant\n26/3/10 23:49';
    expect(isFinancialTransactionMessage(message)).toBe(false);
  });
});
