
export interface SmartPasteTemplate {
  id: string;
  template: string;
  fields: string[];
  defaultValues?: Record<string, string>;
  created: string;
  rawSample?: string;
}
