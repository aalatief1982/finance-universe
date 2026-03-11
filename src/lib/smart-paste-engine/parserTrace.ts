import type { InferenceDecisionTrace } from '@/types/inference';

type StageKey = NonNullable<InferenceDecisionTrace['operational']>['stageTimingsMs'] extends Record<infer K, number> ? K : never;

const nowMs = (): number => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

export class ParserTraceTimer {
  private startedAt = new Map<string, number>();

  start(stage: StageKey) {
    this.startedAt.set(stage, nowMs());
  }

  end(stage: StageKey, trace: InferenceDecisionTrace | undefined) {
    const start = this.startedAt.get(stage);
    if (start === undefined) return;
    const elapsed = Number((nowMs() - start).toFixed(2));
    if (!trace) return;
    trace.operational = trace.operational || {};
    trace.operational.stageTimingsMs = trace.operational.stageTimingsMs || {};
    trace.operational.stageTimingsMs[stage] = elapsed;
  }
}

export const ensureOperationalTrace = (trace: InferenceDecisionTrace): NonNullable<InferenceDecisionTrace['operational']> => {
  trace.operational = trace.operational || {};
  trace.operational.stageTimingsMs = trace.operational.stageTimingsMs || {};
  trace.operational.counters = trace.operational.counters || {};
  trace.operational.counters.localMapsConsulted = trace.operational.counters.localMapsConsulted || {
    templateBank: false,
    keywordBank: false,
    vendorMap: false,
    templateAccountMap: false,
  };
  trace.operational.winners = trace.operational.winners || {};
  return trace.operational;
};

export const createOperationalDebugTrace = (): InferenceDecisionTrace => ({
  confidenceBreakdown: {
    fieldScore: 0,
    templateScore: 0,
    keywordScore: 0,
    overallConfidence: 0,
  },
  templateSelection: {
    selected: 'structure',
    reason: 'Operational trace only.',
    candidates: [],
  },
  fields: [],
  operational: {
    stageTimingsMs: {},
    counters: {
      localMapsConsulted: {
        templateBank: false,
        keywordBank: false,
        vendorMap: false,
        templateAccountMap: false,
      },
    },
    winners: {},
  },
});
