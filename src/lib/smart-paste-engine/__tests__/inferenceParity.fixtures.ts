export interface InferenceParityFixture {
  id: string;
  message: string;
  senderHint: string;
  expected?: {
    type?: 'expense' | 'income' | 'transfer';
    amount?: number;
    currency?: string;
    vendorIncludes?: string;
  };
}

export const inferenceParityFixtures: InferenceParityFixture[] = [
  {
    id: 'en-pos-1',
    senderHint: 'ALRAJHI',
    message:
      'Dear customer, purchase of 45.75 SAR at STARBUCKS on 2024-06-12 using card ending 1234.',
    expected: { type: 'expense', amount: 45.75, currency: 'SAR', vendorIncludes: 'starbucks' },
  },
  {
    id: 'en-atm-1',
    senderHint: 'ALRAJHI',
    message:
      'Withdrawal of SAR 200.00 from ATM RIYADH on 2024-06-14. Available balance SAR 5300.20.',
    expected: { type: 'expense', amount: 200, currency: 'SAR' },
  },
  {
    id: 'en-salary-1',
    senderHint: 'SNB',
    message:
      'Salary transfer received: 8500.00 SAR from ACME LTD on 2024-06-30 to account XXXX9988.',
    expected: { type: 'income', amount: 8500, currency: 'SAR', vendorIncludes: 'acme' },
  },
  {
    id: 'en-online-1',
    senderHint: 'ALINMA',
    message:
      'Online payment of 129.99 SAR at AMAZON SA completed on 2024-05-01.',
    expected: { type: 'expense', amount: 129.99, currency: 'SAR', vendorIncludes: 'amazon' },
  },
  {
    id: 'en-transfer-1',
    senderHint: 'SNB',
    message:
      'Transfer of 300.00 SAR from account 1234 to account 5678 completed on 2024-08-02.',
    expected: { type: 'transfer', amount: 300, currency: 'SAR' },
  },
  {
    id: 'ar-pos-1',
    senderHint: 'الراجحي',
    message:
      'عزيزي العميل، تمت عملية شراء بمبلغ 98.50 ريال من متجر بندة بتاريخ 2024-06-03.',
    expected: { type: 'expense', amount: 98.5, currency: 'SAR', vendorIncludes: 'بندة' },
  },
  {
    id: 'ar-transfer-in-1',
    senderHint: 'SNB',
    message:
      'تم إيداع مبلغ 1200.00 ريال في حسابك بتاريخ 2024-04-20 من مؤسسة النور.',
    expected: { type: 'income', amount: 1200, currency: 'SAR', vendorIncludes: 'النور' },
  },
  {
    id: 'ar-bill-1',
    senderHint: 'STCPAY',
    message:
      'تم سداد فاتورة كهرباء بمبلغ 340.10 ريال بتاريخ 2024-07-15 عبر STC Pay.',
    expected: { type: 'expense', amount: 340.1, currency: 'SAR' },
  },
  {
    id: 'ar-pos-2',
    senderHint: 'ALRAJHI',
    message:
      'شراء عبر نقطة البيع بمبلغ 22.00 SAR لدى Jarir بتاريخ 2024-09-09.',
    expected: { type: 'expense', amount: 22, currency: 'SAR', vendorIncludes: 'jarir' },
  },
  {
    id: 'en-food-1',
    senderHint: 'ANB',
    message:
      'Card purchase 73.40 SAR at ALBAIK JEDDAH on 2024-10-12.',
    expected: { type: 'expense', amount: 73.4, currency: 'SAR', vendorIncludes: 'albaik' },
  },
  {
    id: 'dup-template-a',
    senderHint: 'ALRAJHI',
    message:
      'Purchase done for 15.00 SAR at CAREEM on 2024-11-01 card ****1111.',
    expected: { type: 'expense', amount: 15, currency: 'SAR', vendorIncludes: 'careem' },
  },
  {
    id: 'dup-template-b',
    senderHint: 'ALRAJHI',
    message:
      'Purchase done for 15.00 SAR at CAREEM on 2024-11-01 card ****1111.',
    expected: { type: 'expense', amount: 15, currency: 'SAR', vendorIncludes: 'careem' },
  },
];
