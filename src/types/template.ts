
export interface StructureTemplateEntry {
  id: string;
  template: string;
  rawExample: string;
  defaultValues: {
    type: string;
    fromAccount: string;
    currency: string;
    sender?: string;
  };
  fields: string[];
  createdAt: string;
}

export interface Template {
  id: string;
  template: string;
  rules?: Array<string>;
  confidence?: number;
  fallbackOptions?: Record<string, any>;
}
