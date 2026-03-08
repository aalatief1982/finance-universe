/**
 * @file error-utils.ts
 * @description Error creation and handling helpers with toast notifications.
 *
 * @module utils/error-utils
 *
 * @responsibilities
 * 1. Create standardized AppError objects with metadata
 * 2. Log errors and optionally surface toast notifications
 * 3. Map severity to toast variants
 *
 * @dependencies
 * - types/error: error types and defaults
 * - use-toast.ts: UI notifications
 *
 * @review-tags
 * - @side-effects: logs to console and shows toasts
 * - @risk: error severity defaults must match UX expectations
 *
 * @review-checklist
 * - [ ] Unknown errors are wrapped as AppError
 * - [ ] Toast severity matches error severity
 * - [ ] Silent errors skip toast display
 */

import { ErrorType, AppError, ErrorSeverity, errorSeverityDefaults } from "@/types/error";
import { toast } from "@/hooks/use-toast";

const TOAST_DEDUPE_WINDOW_MS = 10_000;
const toastDedupeMap = new Map<string, number>();
const toastDiagnosticsLoggedSources = new Set<string>();

/**
 * Creates a standardized application error with enhanced metadata
 */
export const createError = (
  type: ErrorType,
  message: string,
  details?: Record<string, unknown>,
  originalError?: unknown,
  severity?: ErrorSeverity,
  isSilent?: boolean
): AppError => {
  return {
    type,
    message,
    severity: severity || errorSeverityDefaults[type],
    details,
    originalError,
    timestamp: Date.now(),
    isSilent: isSilent || false
  };
};

/**
 * Logs an error and optionally shows a toast notification
 */
export const handleError = (
  error: AppError | Error | unknown,
  showToast = true
): AppError => {
  let appError: AppError;
  
  // Convert to AppError if not already
  if ((error as AppError).type) {
    appError = error as AppError;
  } else if (error instanceof Error) {
    appError = createError(
      ErrorType.UNKNOWN,
      error.message,
      { stack: error.stack },
      error
    );
  } else {
    appError = createError(
      ErrorType.UNKNOWN,
      'An unknown error occurred',
      {},
      error
    );
  }
  
  // Add timestamp if not present
  if (!appError.timestamp) {
    appError.timestamp = Date.now();
  }
  
  // Get toast variant based on severity
  const getToastVariant = (severity?: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return "default";
      case ErrorSeverity.WARNING:
        return "default"; // You could create a warning variant
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return "destructive";
      default:
        return "destructive";
    }
  };
  
  // Enhanced console logging with severity and timestamp
  const logLevel = appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.ERROR 
    ? 'error' 
    : appError.severity === ErrorSeverity.WARNING 
      ? 'warn' 
      : 'info';
  
  // Store original console methods to prevent recursion
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  const logMethod = originalConsole[logLevel as keyof typeof originalConsole] as (...args: unknown[]) => void;
  
  if (import.meta.env.MODE === 'development') {
    logMethod(
      `[${appError.severity?.toUpperCase() || 'ERROR'}] [${appError.type}] ${appError.message}`,
      {
        details: appError.details,
        timestamp: new Date(appError.timestamp || Date.now()).toISOString(),
        originalError: appError.originalError
      }
    );
  }

  const sourceTag = typeof appError.details?.source === 'string' ? appError.details.source : 'UNKNOWN';

  if (!toastDiagnosticsLoggedSources.has(sourceTag)) {
    toastDiagnosticsLoggedSources.add(sourceTag);
    console.error('[TOAST_ERROR]', {
      source: sourceTag,
      message: appError.message,
      error: appError.originalError ?? error,
    });
    console.error(new Error(`[TOAST_STACK] ${sourceTag}`).stack);
  }

  const dedupeKey = `${sourceTag}::${appError.message}`;
  const now = Date.now();
  const lastToastAt = toastDedupeMap.get(dedupeKey) ?? 0;
  const shouldShowToast = now - lastToastAt >= TOAST_DEDUPE_WINDOW_MS;
  
  // Show toast if requested and error is not silent
  if (showToast && !appError.isSilent && shouldShowToast) {
    toastDedupeMap.set(dedupeKey, now);
    toast({
      title: getTitleFromErrorType(appError.type),
      description: appError.message,
      variant: getToastVariant(appError.severity),
    });
  }
  
  // For critical errors, could also send to error reporting service here
  if (appError.severity === ErrorSeverity.CRITICAL) {
    // Theoretical example: reportToErrorService(appError);
  }
  
  return appError;
};

/**
 * Handles validation errors
 */
export const handleValidationError = (
  message: string,
  details?: Record<string, unknown>,
  isSilent?: boolean
): AppError => {
  const error = createError(
    ErrorType.VALIDATION, 
    message, 
    details, 
    undefined, 
    ErrorSeverity.WARNING,
    isSilent
  );
  
  if (import.meta.env.MODE === 'development') {
    console.warn('Validation error:', error);
  }
  
  if (!isSilent) {
    toast({
      title: "Invalid transaction",
      description: message,
      variant: "default",
    });
  }
  
  return error;
};

/**
 * Handles API errors
 */
export const handleApiError = (
  message: string,
  statusCode?: number,
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError => {
  // Determine severity based on status code
  let severity: ErrorSeverity;
  if (!statusCode || statusCode >= 500) {
    severity = ErrorSeverity.ERROR;
  } else if (statusCode === 401 || statusCode === 403) {
    severity = ErrorSeverity.WARNING;
  } else {
    severity = ErrorSeverity.WARNING;
  }
  
  const enhancedDetails = {
    ...details,
    statusCode,
  };
  
  const error = createError(
    ErrorType.API,
    message,
    enhancedDetails,
    originalError,
    severity
  );
  
  return handleError(error);
};

/**
 * Handles network connectivity errors
 */
export const handleNetworkError = (
  message: string = "Network connection issue detected",
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError => {
  const error = createError(
    ErrorType.NETWORK,
    message,
    details,
    originalError,
    ErrorSeverity.ERROR
  );
  
  return handleError(error);
};

/**
 * Handles authentication errors
 */
export const handleAuthError = (
  message: string = "Authentication failed",
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError => {
  const error = createError(
    ErrorType.AUTH,
    message,
    details,
    originalError,
    ErrorSeverity.ERROR
  );
  
  return handleError(error);
};

/**
 * Attempts to execute a function and handle any errors
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => AppError
): Promise<T | AppError> => {
  try {
    return await fn();
  } catch (error) {
    return errorHandler ? errorHandler(error) : handleError(error);
  }
};

/**
 * Gets a user-friendly title from an error type
 */
const getTitleFromErrorType = (type: ErrorType): string => {
  switch (type) {
    case ErrorType.VALIDATION:
      return "Invalid transaction";
    case ErrorType.API:
      return "Could not complete request";
    case ErrorType.PARSING:
      return "Message could not be parsed";
    case ErrorType.STORAGE:
      return "Could not save data";
    case ErrorType.PERMISSION:
      return "Permission required";
    case ErrorType.CURRENCY:
      return "Could not update exchange rate";
    case ErrorType.NETWORK:
      return "Connection issue";
    case ErrorType.AUTH:
      return "Authentication failed";
    case ErrorType.TIMEOUT:
      return "Request timed out";
    case ErrorType.TRANSACTION:
      return "Could not save transaction";
    default:
      return "Something went wrong";
  }
};
