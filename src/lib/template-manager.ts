// 📁 Path: src/lib/template-manager.ts (🆕 New)

import { TransactionDraft } from "../types/transaction";

export interface StructureTemplate {
  hash: string;
  structure: string;
  fields: (keyof TransactionDraft)[];
  defaultValues?: Partial<Record<keyof TransactionDraft, any>>;
  createdAt: string;
}

const templateStore: Record<string, StructureTemplate> = {};

export function getTemplateByHash(hash: string): StructureTemplate | undefined {
  return templateStore[hash];
}

export function saveNewTemplate(template: StructureTemplate): void {
  templateStore[template.hash] = template;
}

export function templateExists(hash: string): boolean {
  return Boolean(templateStore[hash]);
}

export function listTemplates(): StructureTemplate[] {
  return Object.values(templateStore);
}
