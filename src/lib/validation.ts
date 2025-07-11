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
  type: z.enum(["income", "expense", "transfer"]),
  fromAccount: z.string().optional(), // Make fromAccount optional here
  toAccount: z.string().optional().nullable(),
  notes: z.string().optional(),
  description: z.string().optional(),
  person: z.enum(["Ahmed", "Marwa", "Youssef", "Salma", "Mazen", "none"]).optional().nullable(),
  source: z.enum(["manual", "sms"]).optional(),
  originalCurrency: z.string().optional(),
  currency: z.string().optional().default("SAR"),
  smsDetails: z
    .object({
      sender: z.string(),
      message: z.string(),
      timestamp: z.string()
    })
    .optional()
}).refine(data => {
  // If transaction type is transfer, toAccount is required
  if (data.type === 'transfer' && !data.toAccount) {
    return false;
  }
  return true;
}, {
  message: "To Account is required for transfer transactions",
  path: ["toAccount"]
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
  currency: z.string(),
  language: z.string()
});

// NEW SCHEMAS BELOW

// Category validation schema
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Category name is required").max(50, "Category name is too long"),
  parentId: z.string().uuid().optional(),
  metadata: z.object({
    description: z.string().optional(),
    icon: z.object({
      name: z.string(),
      color: z.string().optional()
    }).optional(),
    color: z.string().optional(),
    budget: z.number().nonnegative().optional(),
    isHidden: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  }).optional(),
  subcategories: z.lazy(() => z.array(categorySchema)).optional()
});

// Category rule validation schema
export const categoryRuleSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string().min(1, "Pattern is required"),
  categoryId: z.string().uuid(),
  isRegex: z.boolean().optional(),
  priority: z.number().int(),
  description: z.string().optional()
});

// Enhanced User preferences validation schema with more detailed options
export const userPreferencesSchema = z.object({
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CNY", "INR"]),
  language: z.string(),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({
    enabled: z.boolean(),
    types: z.array(z.enum(["sms", "budget", "insights", "security", "marketing"])),
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    quietHours: z.object({
      enabled: z.boolean().optional(),
      start: z.string().optional(), // Time format: "HH:MM"
      end: z.string().optional(),   // Time format: "HH:MM"
    }).optional()
  }),
  displayOptions: z.object({
    showCents: z.boolean(),
    weekStartsOn: z.enum(["sunday", "monday", "saturday"]),
    defaultView: z.enum(["list", "stats", "calendar"]),
    compactMode: z.boolean().optional(),
    showCategories: z.boolean().optional(),
    showTags: z.boolean().optional()
  }),
  privacy: z.object({
    maskAmounts: z.boolean().optional(),
    requireAuthForSensitiveActions: z.boolean().optional(),
    dataSharing: z.enum(["none", "anonymous", "full"]).optional()
  }).optional(),
  dataManagement: z.object({
    autoBackup: z.boolean().optional(),
    backupFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
    dataRetention: z.enum(["3months", "6months", "1year", "forever"]).optional()
  }).optional(),
  updatedAt: z.string().datetime()
});

// Budget validation schema
export const budgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Budget name is required"),
  amount: z.number().positive("Budget amount must be positive"),
  period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  categoryId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  notification: z.object({
    enabled: z.boolean(),
    thresholdPercentage: z.number().min(1).max(100).optional()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// Data import/export validation schema
export const dataImportSchema = z.object({
  version: z.string(),
  exportDate: z.string().datetime(),
  data: z.object({
    transactions: z.array(transactionSchema).optional(),
    categories: z.array(categorySchema).optional(),
    rules: z.array(categoryRuleSchema).optional(),
    budgets: z.array(budgetSchema).optional(),
    preferences: userPreferencesSchema.optional()
  })
});

// Transaction category change history schema
export const transactionCategoryChangeSchema = z.object({
  transactionId: z.string().uuid(),
  oldCategoryId: z.string().uuid().optional(),
  newCategoryId: z.string().uuid(),
  timestamp: z.string().datetime()
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
      if (import.meta.env.MODE === 'development') {
        console.error("Unexpected validation error:", error);
      }
      return { success: false, error: "Unexpected validation error" };
    }
  }
}

// Update the transaction type to include validation using the schema
export type ValidatedTransaction = z.infer<typeof transactionSchema>;
export type ValidatedCategory = z.infer<typeof categorySchema>;
export type ValidatedCategoryRule = z.infer<typeof categoryRuleSchema>;
export type ValidatedUserPreferences = z.infer<typeof userPreferencesSchema>;
export type ValidatedBudget = z.infer<typeof budgetSchema>;
export type ValidatedDataImport = z.infer<typeof dataImportSchema>;
export type ValidatedTransactionCategoryChange = z.infer<typeof transactionCategoryChangeSchema>;

// Update the Person type in the TransactionContext to handle validation
export function validateNewTransaction(transaction: Omit<ValidatedTransaction, 'id'>) {
  try {
    // We need to create a new schema without the id field
    const transactionWithoutIdSchema = z.object({
      title: z.string().min(1, "Title is required").max(100, "Title is too long"),
      amount: z.number().refine(n => !isNaN(n), "Amount must be a valid number"),
      category: z.string().min(1, "Category is required"),
      date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
      type: z.enum(["income", "expense", "transfer"]),
      fromAccount: z.string().optional(),
      toAccount: z.string().optional().nullable(),
      notes: z.string().optional(),
      description: z.string().optional(),
      person: z.enum(["Ahmed", "Marwa", "Youssef", "Salma", "Mazen", "none"]).optional().nullable(),
      source: z.enum(["manual", "sms"]).optional(),
      originalCurrency: z.string().optional(),
      currency: z.string().optional().default("SAR"),
      smsDetails: z
        .object({
          sender: z.string(),
          message: z.string(),
          timestamp: z.string()
        })
        .optional()
    }).refine(data => {
      // If transaction type is transfer, toAccount is required
      if (data.type === 'transfer' && !data.toAccount) {
        return false;
      }
      return true;
    }, {
      message: "To Account is required for transfer transactions",
      path: ["toAccount"]
    });
    
    return { 
      success: true, 
      data: transactionWithoutIdSchema.parse(transaction) 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join(', ');
      return { success: false, error: `Validation Error: ${errorMessages}` };
    } else {
      if (import.meta.env.MODE === 'development') {
        console.error("Unexpected validation error:", error);
      }
      return { success: false, error: "Unexpected validation error" };
    }
  }
}
