import { ErrorType, AppError, ErrorSeverity, errorSeverityDefaults } from "@/types/error";
import { toast } from "@/hooks/use-toast";

/**
 * Creates a standardized application error with enhanced metadata
 */
export const createError = (
  type: ErrorType,
  message: string,
  details?: Record<string, any>,
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
  
  const logMethod = console[logLevel as keyof typeof console] as (...args: any[]) => void;
  
  logMethod(
    `[${appError.severity?.toUpperCase() || 'ERROR'}] [${appError.type}] ${appError.message}`,
    {
      details: appError.details,
      timestamp: new Date(appError.timestamp || Date.now()).toISOString(),
      originalError: appError.originalError
    }
  );
  
  // Show toast if requested and error is not silent
  if (showToast && !appError.isSilent) {
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
  details?: Record<string, any>,
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
  
  if (process.env.NODE_ENV === 'development') console.warn('Validation error:', error);
  
  if (!isSilent) {
    toast({
      title: "Validation Error",
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
  details?: Record<string, any>,
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
  details?: Record<string, any>,
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
  details?: Record<string, any>,
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
      return "Validation Error";
    case ErrorType.API:
      return "API Error";
    case ErrorType.PARSING:
      return "Parsing Error";
    case ErrorType.STORAGE:
      return "Storage Error";
    case ErrorType.PERMISSION:
      return "Permission Error";
    case ErrorType.CURRENCY:
      return "Currency Error";
    case ErrorType.NETWORK:
      return "Network Error";
    case ErrorType.AUTH:
      return "Authentication Error";
    case ErrorType.TIMEOUT:
      return "Timeout Error";
    case ErrorType.TRANSACTION:
      return "Transaction Error";
    default:
      return "Error";
  }
};
