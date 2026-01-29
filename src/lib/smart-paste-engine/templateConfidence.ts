import { SmartPasteTemplate, TemplateStatus } from '@/types/template';

export interface ConfidenceResult {
  score: number;           // 0-100
  status: TemplateStatus;
  recommendation: string;
}

const THRESHOLDS = {
  READY: 80,
  LEARNING: 50,
  MIN_USAGE_FOR_READY: 5,
  MIN_USAGE_FOR_EVALUATION: 3,
};

export function computeTemplateConfidence(template: SmartPasteTemplate): ConfidenceResult {
  const meta = template.meta;
  if (!meta) {
    return { score: 0, status: 'candidate', recommendation: 'New template, needs usage data' };
  }

  const usage = meta.usageCount || 0;
  const success = meta.successCount || 0;
  const fallback = meta.fallbackCount || 0;

  if (usage < THRESHOLDS.MIN_USAGE_FOR_EVALUATION) {
    return {
      score: 50,
      status: 'candidate',
      recommendation: `Needs ${THRESHOLDS.MIN_USAGE_FOR_EVALUATION - usage} more uses to evaluate`
    };
  }

  const total = success + fallback;
  const successRate = total > 0 ? (success / total) * 100 : 50;

  let recencyPenalty = 0;
  if (meta.lastFailureAt) {
    const daysSinceFailure = (Date.now() - new Date(meta.lastFailureAt).getTime()) / 86400000;
    if (daysSinceFailure < 7) {
      recencyPenalty = Math.max(0, 10 - daysSinceFailure);
    }
  }

  const finalScore = Math.max(0, Math.min(100, successRate - recencyPenalty));

  let status: TemplateStatus;
  let recommendation: string;

  if (finalScore >= THRESHOLDS.READY && usage >= THRESHOLDS.MIN_USAGE_FOR_READY) {
    status = 'ready';
    recommendation = 'Template is reliable and ready for auto-apply';
  } else if (finalScore >= THRESHOLDS.LEARNING) {
    status = 'learning';
    recommendation = 'Template needs more successful uses or manual review';
  } else {
    status = 'deprecated';
    recommendation = 'Template has too many failures, consider retraining';
  }

  return { score: finalScore, status, recommendation };
}

export function shouldAutoApply(template: SmartPasteTemplate): boolean {
  const { status, score } = computeTemplateConfidence(template);
  return status === 'ready' && score >= THRESHOLDS.READY;
}
