
// Type of error
export enum ErrorType {
  AUTH = 'AUTH',
  API = 'API',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

// Error interface
export interface AppError {
  type: ErrorType;
  message: string;
  context?: any;
  originalError?: any;
  timestamp: Date;
}
