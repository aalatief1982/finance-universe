export interface TemplateStructure {
  structure: string;
  hash: string;
  version: string;
  hashAlgorithm: string;
}

export interface SmartPasteTemplate {
  id: string;
  template: string;
  fields: string[];
  rawSample: string;
  created?: string;
  defaultValues?: Record<string, string>;
  structure?: TemplateStructure;
}
