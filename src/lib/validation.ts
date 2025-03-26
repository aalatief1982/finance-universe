
import { z } from 'zod';
import { handleValidationError } from '@/utils/error-utils';
import { SupportedCurrency } from '@/types/locale';

// Transaction validation schema
export const transactionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  amount: z.number().refine(n => !isNaN(n), "Amount must be a valid number"),
  category: z.string().min(1, "Category is required"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  type: z.enum(["income", "expense"]),
  notes: z.string().optional(),
  source: z.enum(["manual", "sms"]).optional(),
  originalCurrency: z.string().optional(),
  smsDetails: z
    .object({
      sender: z.string(),
      message: z.string(),
      timestamp: z.string()
    })
    .optional()
});

// SMS message validation schema
export const smsMessageSchema = z.object({
  sender: z.string().min(1, "Sender is required"),
  message: z.string().min(1, "Message is required"),
  date: z.date()
});

// Currency conversion validation schema
export const currencyConversionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  fromCurrency: z.string().min(3, "Invalid currency code").max(3, "Invalid currency code"),
  toCurrency: z.string().min(3, "Invalid currency code").max(3, "Invalid currency code"),
  conversionRate: z.number().positive("Conversion rate must be positive"),
  date: z.date()
});

// Locale settings validation schema
export const localeSettingsSchema = z.object({
  locale: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string()
});

/**
 * Validates data against a schema and returns validation result
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessage = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      
      handleValidationError(errorMessage, { zodErrors: result.error.errors });
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    handleValidationError(message);
    return { success: false, error: message };
  }
}

// Update the transaction type to include validation using the schema
export type ValidatedTransaction = z.infer<typeof transactionSchema>;
