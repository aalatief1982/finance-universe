
export interface SmartPasteTemplate {
  id: string;
  template: string;
  fields: string[];
  defaultValues?: Record<string, string>;
  created: string;
  rawSample?: string;
  version?: string;
  hashAlgorithm?: string;
  meta?: TemplateMeta;
}

export interface TemplateMeta {
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
  successCount?: number;
  fallbackCount?: number;
}

export interface StructureTemplateEntry {
  id: string;
  structure: string;
  fields: string[];
  createdAt: string;
  updatedAt?: string;
  confidence?: number;
}
