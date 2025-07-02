export function normalizeTemplateStructure(template: string): string {
  return template.toLowerCase().replace(/\s+/g, ' ').trim();
}
