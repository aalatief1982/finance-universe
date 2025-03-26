
import { ErrorType, AppError } from "@/types/error";
import { toast } from "@/hooks/use-toast";

/**
 * Creates a standardized application error
 */
export const createError = (
  type: ErrorType,
  message: string,
  details?: Record<string, any>,
  originalError?: unknown
): AppError => {
  return {
    type,
    message,
    details,
    originalError
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
      {},
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
  
  // Log the error
  console.error('Application error:', appError);
  
  // Show toast if requested
  if (showToast) {
    toast({
      title: "Error",
      description: appError.message,
      variant: "destructive",
    });
  }
  
  return appError;
};

/**
 * Handles validation errors
 */
export const handleValidationError = (
  message: string,
  details?: Record<string, any>
): AppError => {
  const error = createError(ErrorType.VALIDATION, message, details);
  console.warn('Validation error:', error);
  return error;
};
