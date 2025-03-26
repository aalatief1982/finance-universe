
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
  sender: z.string(),
  message: z.string(),
  date: z.date()
});

// Currency conversion validation schema
export const currencyConversionSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number()
});

// Locale settings validation schema
export const localeSettingsSchema = z.object({
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CNY", "INR"]) as z.ZodEnum<any>,
  language: z.string()
});

// Define the result type explicitly for better type safety
export type ValidationResult<T> = 
  | { success: true; data: T; error?: never } 
  | { success: false; error: string; data?: never };

/**
 * Validates data against a schema and returns validation result
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const parsedData = schema.parse(data);
    return { success: true, data: parsedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Improved error handling: Aggregate all error messages
      const errorMessages = error.errors.map(e => e.message).join(', ');
      return { success: false, error: `Validation Error: ${errorMessages}` };
    } else {
      // Handle non-Zod errors
      console.error("Unexpected validation error:", error);
      return { success: false, error: "Unexpected validation error" };
    }
  }
}

// Update the transaction type to include validation using the schema
export type ValidatedTransaction = z.infer<typeof transactionSchema>;
