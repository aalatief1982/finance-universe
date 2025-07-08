
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
  [ErrorType.FORMATTING]: ErrorSeverity.WARNING,
  [ErrorType.UNKNOWN]: ErrorSeverity.ERROR
};

// Helper function to determine if an error should be reported to analytics
export const shouldReportError = (error: AppError): boolean => {
  // Only report errors with severity ERROR or CRITICAL
  return error.severity === ErrorSeverity.ERROR || 
         error.severity === ErrorSeverity.CRITICAL;
};
