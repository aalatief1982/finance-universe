import { SmartPasteTemplate } from '@/types/template';

export function loadTemplateBank(): Record<string, SmartPasteTemplate> {
  const raw = localStorage.getItem('xpensia_template_bank');
  return raw ? JSON.parse(raw) : {};
}

export function saveTemplateBank(templates: Record<string, SmartPasteTemplate>) {
  localStorage.setItem('xpensia_template_bank', JSON.stringify(templates));
}
