export interface Transaction {
  id?: string;
  amount?: number;
  vendor: string;
  date?: string;
  category?: string;
  subcategory?: string;
  fromAccount?: string;
  source?: string;
  [key: string]: any;
}
