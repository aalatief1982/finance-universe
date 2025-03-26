
export interface User {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  settings?: {
    currency?: string;
    language?: string;
    theme?: string;
  };
}
