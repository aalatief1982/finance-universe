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
