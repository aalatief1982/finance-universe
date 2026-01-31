/**
 * @file templateService.ts
 * @description Computes template learning statistics for settings UI.
 *
 * @module services/templateService
 *
 * @responsibilities
 * 1. Aggregate template usage, coverage, and efficiency stats
 * 2. Provide top templates and field distribution metrics
 * 3. Support time-range selection for stats display
 *
 * @dependencies
 * - templateUtils.ts: template bank queries
 *
 * @review-tags
 * - @risk: divide-by-zero in percentage calculations
 * - @performance: iterates over all templates
 *
 * @review-checklist
 * - [ ] Zero totals guard percentages
 * - [ ] Most-used list sorted by usageCount
 * - [ ] Stale detection uses correct threshold
 */

import { getAllTemplates, getStaleTemplates } from '@/lib/smart-paste-engine/templateUtils';

export type FieldStat = {
  fieldName: string;
  count: number;
  coverage: number; // percent of templates that include this field
  avgUsage: number; // average usageCount among templates containing this field
  avgConfidence?: number | null; // not available in current model
};

export type TemplateStats = {
  totalTemplates: number;
  averageFields: number;
  averageUsage: number;
  readyTemplates: number;
  totalSuccess: number;
  totalFallback: number;
  efficiency: number; // percent
  learningCoverage: number; // percent of templates seen at least once
  staleCount: number;
  mostUsed: Array<{ id: string; name: string; count: number }>;
  newestCreatedAt?: string | null;
  topFields: Array<{ fieldName: string; count: number }>;
  fieldStats: Record<string, FieldStat>;
  avgInferenceTimeMs?: number | null;
  falsePositiveRate?: number | null;
  falseNegativeRate?: number | null;
};

const RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export async function getTemplateStats(range: '7d' | '30d' | '90d' = '30d'): Promise<TemplateStats> {
  // Load templates from the local template bank
  const templates = getAllTemplates();
  const totalTemplates = templates.length;

  // Helper to parse meta numbers
  const safeNum = (v: any) => (typeof v === 'number' ? v : 0);

  // Average fields
  const averageFields = totalTemplates === 0 ? 0 : templates.reduce((s, t) => s + (t.fields?.length || 0), 0) / totalTemplates;

  // Aggregate usages/success/fallback
  const totalSuccess = templates.reduce((s, t) => s + safeNum(t.meta?.successCount), 0);
  const totalFallback = templates.reduce((s, t) => s + safeNum(t.meta?.fallbackCount), 0);
  const sumUsage = templates.reduce((s, t) => s + safeNum(t.meta?.usageCount), 0);
  const averageUsage = totalTemplates === 0 ? 0 : sumUsage / totalTemplates;

  // Efficiency
  const denom = totalSuccess + totalFallback;
  const efficiency = denom === 0 ? 100 : (totalSuccess / denom) * 100;

  // Learning coverage: percent templates seen at least once
  const seenCount = templates.filter(t => safeNum(t.meta?.usageCount) > 0).length;
  const learningCoverage = totalTemplates === 0 ? 0 : (seenCount / totalTemplates) * 100;

  // Stale templates (older than threshold)
  const staleTemplates = getStaleTemplates(
    // getStaleTemplates expects a bank map; getAllTemplates returns array, so reconstruct map
    Object.fromEntries(templates.map(t => [t.id, t])),
    90,
  );
  const staleCount = staleTemplates.length;

  // Most used templates (by usageCount)
  const mostUsed = [...templates]
    .sort((a, b) => (safeNum(b.meta?.usageCount) - safeNum(a.meta?.usageCount)))
    .slice(0, 10)
    .map(t => ({ id: t.id, name: t.rawSample || t.id, count: safeNum(t.meta?.usageCount) }));

  // Newest createdAt
  const newestCreatedAt = templates.reduce((latest: string | null, t) => {
    const c = t.meta?.createdAt || t.created;
    if (!c) return latest;
    return !latest || new Date(c) > new Date(latest) ? c : latest;
  }, null as string | null);

  // Top fields and per-field stats
  const fieldMap: Record<string, { count: number; usageSum: number }> = {};
  templates.forEach((t) => {
    const usage = safeNum(t.meta?.usageCount);
    (t.fields || []).forEach((f) => {
      if (!fieldMap[f]) fieldMap[f] = { count: 0, usageSum: 0 };
      fieldMap[f].count += 1;
      fieldMap[f].usageSum += usage;
    });
  });

  const topFields = Object.entries(fieldMap)
    .map(([fieldName, v]) => ({ fieldName, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const fieldStats: Record<string, FieldStat> = {};
  Object.entries(fieldMap).forEach(([fieldName, v]) => {
    fieldStats[fieldName] = {
      fieldName,
      count: v.count,
      coverage: totalTemplates === 0 ? 0 : (v.count / totalTemplates) * 100,
      avgUsage: v.count === 0 ? 0 : v.usageSum / v.count,
      avgConfidence: null,
    };
  });

  // Range-based filtering (best-effort): prefer lastUsedAt within range; fall back to overall counts
  const days = RANGE_DAYS[range] || 30;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const templatesInRange = templates.filter(t => {
    const lu = t.meta?.lastUsedAt || t.meta?.createdAt || t.created;
    return lu ? new Date(lu).getTime() >= since : false;
  });

  // If we have templates in range, compute some metrics scoped to range (usage, success/fallback)
  const scopeTemplates = templatesInRange.length ? templatesInRange : templates;
  const scopedTotalSuccess = scopeTemplates.reduce((s, t) => s + safeNum(t.meta?.successCount), 0);
  const scopedTotalFallback = scopeTemplates.reduce((s, t) => s + safeNum(t.meta?.fallbackCount), 0);
  const scopedSumUsage = scopeTemplates.reduce((s, t) => s + safeNum(t.meta?.usageCount), 0);
  const scopedAverageUsage = scopeTemplates.length === 0 ? 0 : scopedSumUsage / scopeTemplates.length;

  return {
    totalTemplates,
    averageFields: Number(averageFields.toFixed(2)),
    averageUsage: Number(scopedAverageUsage.toFixed(2)),
    readyTemplates: templates.filter(t => safeNum(t.meta?.successCount) > 0).length,
    totalSuccess: scopedTotalSuccess,
    totalFallback: scopedTotalFallback,
    efficiency: Number(efficiency.toFixed(2)),
    learningCoverage: Number(learningCoverage.toFixed(2)),
    staleCount,
    mostUsed,
    newestCreatedAt,
    topFields,
    fieldStats,
    avgInferenceTimeMs: null,
    falsePositiveRate: null,
    falseNegativeRate: null,
  } as TemplateStats;
}

export default {
  getTemplateStats,
};
