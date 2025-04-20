export function loadTemplateBank(): SmartPasteTemplate[] {
  const raw = localStorage.getItem('xpensia_structure_templates');
  return raw ? JSON.parse(raw) : [];
}

export function saveTemplateBank(templates: SmartPasteTemplate[]) {
  localStorage.setItem('xpensia_structure_templates', JSON.stringify(templates));
}
