import { loadTemplateBank, saveTemplateBank } from './templateUtils';
import { computeTemplateConfidence } from './templateConfidence';
import { SmartPasteTemplate } from '@/types/template';

export function migrateTemplatesToV2(): number {
  const templates = loadTemplateBank();
  let migrated = 0;
  for (const key of Object.keys(templates)) {
    const t = templates[key];
    if (t.meta?.status) continue;
    if (!t.meta) {
      t.meta = {
        createdAt: t.created || new Date().toISOString(),
        usageCount: 0,
        successCount: 0,
        fallbackCount: 0,
      };
    }
    const { score, status } = computeTemplateConfidence(t);
    t.meta.confidenceScore = score;
    t.meta.status = status;
    templates[key] = t;
    migrated++;
  }
  if (migrated > 0) {
    saveTemplateBank(templates);
  }
  return migrated;
}