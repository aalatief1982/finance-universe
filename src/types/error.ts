
// Type of error
export enum ErrorType {
  AUTH = 'AUTH',
  API = 'API',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
  STORAGE = 'STORAGE',
  CURRENCY = 'CURRENCY'
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error interface
export interface AppError {
  type: ErrorType;
  message: string;
  context?: any;
  originalError?: any;
  timestamp: Date;
  severity?: ErrorSeverity;
}
