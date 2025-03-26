
export enum ErrorType {
  VALIDATION = 'validation',
  API = 'api',
  PARSING = 'parsing',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  CURRENCY = 'currency',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  originalError?: unknown;
}
