
export interface SmartPasteTemplate {
  id: string;
  template: string;
  fields: string[];
  defaultValues?: Record<string, string>;
  created: string;
  rawSample?: string;
}

export interface StructureTemplateEntry {
  id: string;
  structure: string;
  fields: string[];
  createdAt: string;
  updatedAt?: string;
  confidence?: number;
}
