
import { AppError, ErrorType, ErrorSeverity } from '@/types/error';

// Create a new error instance
export const createError = (
  type: ErrorType,
  message: string,
  context: any = {},
  originalError: any = null
): AppError => {
  return {
    type,
    message,
    context,
    originalError,
    timestamp: new Date(),
    severity: context?.severity || ErrorSeverity.ERROR
  };
};

// Log and handle errors
export const handleError = (errorInfo: Partial<AppError> | Error): AppError => {
  // If a regular Error is passed, convert it to our AppError format
  if (errorInfo instanceof Error) {
    return handleError({
      type: ErrorType.UNKNOWN,
      message: errorInfo.message,
      originalError: errorInfo,
    });
  }
  
  // Ensure we have a complete AppError object
  const appError: AppError = {
    type: errorInfo.type || ErrorType.UNKNOWN,
    message: errorInfo.message || 'An unknown error occurred',
    context: errorInfo.context || {},
    originalError: errorInfo.originalError || null,
    timestamp: errorInfo.timestamp || new Date(),
    severity: errorInfo.severity || ErrorSeverity.ERROR
  };
  
  // Log the error to console
  console.error(`[${appError.type}] ${appError.message}`, {
    context: appError.context,
    originalError: appError.originalError,
    severity: appError.severity,
    timestamp: appError.timestamp
  });
  
  // Here you could add additional error handling like sending to monitoring service
  
  return appError;
};

// Specific error handlers for different types
export const handleValidationError = (
  message: string,
  context: any = {},
  logOnly: boolean = false
): AppError => {
  const appError = createError(
    ErrorType.VALIDATION,
    message,
    context,
    null
  );
  
  if (!logOnly) {
    // Additional validation error handling logic here
  }
  
  return handleError(appError);
};

export const handleNetworkError = (
  message: string,
  context: any = {},
  originalError: any = null
): AppError => {
  const appError = createError(
    ErrorType.NETWORK,
    message,
    context,
    originalError
  );
  
  // Additional network error handling logic here
  
  return handleError(appError);
};

export const handleAuthError = (
  message: string,
  context: any = {},
  originalError: any = null
): AppError => {
  const appError = createError(
    ErrorType.AUTH,
    message,
    context,
    originalError
  );
  
  // Additional auth error handling logic here
  
  return handleError(appError);
};
