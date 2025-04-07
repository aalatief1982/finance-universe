
import { AppError, ErrorType } from '@/types/error';

/**
 * Creates a standardized error object
 */
export const createError = (
  type: ErrorType,
  message: string,
  context?: any,
  originalError?: any
): AppError => {
  return {
    type,
    message,
    context,
    originalError,
    timestamp: new Date()
  };
};

/**
 * Handles an error centrally
 */
export const handleError = (error: AppError): void => {
  // Log error to console
  console.error(`[${error.type}] ${error.message}`, {
    context: error.context,
    originalError: error.originalError,
    timestamp: error.timestamp
  });
  
  // In a real app, this might:
  // - Send error to a monitoring service
  // - Show a notification to the user
  // - Take recovery actions
};

/**
 * Handles validation errors
 */
export const handleValidationError = (error: any): string => {
  if (error?.errors?.length > 0) {
    // Extract validation error messages
    return error.errors.map((err: any) => err.message).join(', ');
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Validation failed. Please check your input.';
};
