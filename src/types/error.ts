/**
 * @file error.ts
 * @description Type definitions for error.
 *
 * @module types/error
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

export enum ErrorType {
  VALIDATION = 'validation',
  API = 'api',
  PARSING = 'parsing',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  CURRENCY = 'currency',
  NETWORK = 'network',
  AUTH = 'authentication',
  TIMEOUT = 'timeout',
  TRANSACTION = 'transaction',
  FORMATTING = 'formatting',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AppError {
  type: ErrorType;
  message: string;
  severity?: ErrorSeverity;
  code?: string;
  details?: Record<string, any>;
  originalError?: unknown;
  timestamp?: number;
  isSilent?: boolean;  // Indicates if the error should be shown to the user
}

// Error status mapping
export const errorSeverityDefaults: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.VALIDATION]: ErrorSeverity.WARNING,
  [ErrorType.API]: ErrorSeverity.ERROR,
  [ErrorType.PARSING]: ErrorSeverity.WARNING,
  [ErrorType.STORAGE]: ErrorSeverity.ERROR,
  [ErrorType.PERMISSION]: ErrorSeverity.ERROR,
  [ErrorType.CURRENCY]: ErrorSeverity.WARNING,
  [ErrorType.NETWORK]: ErrorSeverity.ERROR,
  [ErrorType.AUTH]: ErrorSeverity.ERROR,
  [ErrorType.TIMEOUT]: ErrorSeverity.WARNING,
  [ErrorType.TRANSACTION]: ErrorSeverity.ERROR,
  [ErrorType.FORMATTING]: ErrorSeverity.WARNING, // Add this line for the formatting error severity
  [ErrorType.UNKNOWN]: ErrorSeverity.ERROR
};

// Helper function to determine if an error should be reported to analytics
export const shouldReportError = (error: AppError): boolean => {
  // Only report errors with severity ERROR or CRITICAL
  return error.severity === ErrorSeverity.ERROR || 
         error.severity === ErrorSeverity.CRITICAL;
};
