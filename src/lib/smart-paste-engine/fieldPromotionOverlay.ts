import { CONFIDENCE_OVERLAY_ENABLED } from '@/lib/envFlags';
import {
  buildEdgeKeysFromContext,
  getConfidenceGraph,
  getEdgeStat,
  normalizeVendorKey,
  recordConfirmation,
  saveConfidenceGraph,
} from './confidenceGraph';

export type PromotableField = 'fromAccount' | 'type';

interface PromotionOverlayContext {
  senderHint?: string;
  templateHash?: string;
  vendor?: string;
  templateExactMatch?: boolean;
  accountToken?: string;
  rawMessage?: string;
  accountCandidates?: string[];
  fromAccountDeterministic?: boolean;
  fromAccountSource?: string;
  fields: Partial<
    Record<PromotableField | 'vendor' | 'category' | 'subcategory', { value?: string; score: number; source?: string; sourceKind?: string }>
  >;
}

interface PromotionEvidence {
  field: 'type' | 'fromAccount';
  sourceKind: 'promoted_by_history';
  ruleId: string;
  edgeKey: string;
  valueKey: string;
  confirm: number;
  contradict: number;
  purity: number;
  freshnessDays: number;
  message: string;
}

interface PromotionEvalOptions {
  minConfirm: number;
  minPurity: number;
  maxFreshnessDays: number;
}

interface PromotionDecision {
  promoted: boolean;
  purity: number;
  freshnessDays: number;
}

interface RecordLearningInput {
  senderHint?: string;
  templateHash?: string;
  vendor?: string;
  predicted: Partial<Record<PromotableField, string | undefined>>;
  confirmed: Partial<Record<PromotableField, string | undefined>>;
  accountToken?: string;
  rawMessage?: string;
  accountCandidates?: string[];
}

const TYPE_PROMOTION_SCORE = 0.85;
const FROM_ACCOUNT_PROMOTION_SCORE = 0.85;

const getTemplateBase = (senderHint?: string, fromAccount?: string): string => {
  const sender = (senderHint || '').trim().toLowerCase();
  if (sender) return sender;
  const account = (fromAccount || '').trim().toLowerCase();
  if (account) return account;
  return 'unknown';
};

const normalizeAccountToken = (token?: string): string => {
  const value = (token || '').trim();
  if (!value) return '';
  const last4 = value.match(/(\d{4})$/)?.[1];
  if (last4) return `last4:${last4}`;
  return value.toLowerCase();
};

const getFreshnessDays = (lastConfirmed: string): number => {
  if (!lastConfirmed) return Number.MAX_SAFE_INTEGER;
  const then = new Date(lastConfirmed);
  if (Number.isNaN(then.getTime())) return Number.MAX_SAFE_INTEGER;
  return Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
};

export const evaluatePromotion = (
  stat: { confirm: number; contradict: number; lastConfirmed: string },
  opts: PromotionEvalOptions,
): PromotionDecision => {
  const total = stat.confirm + stat.contradict;
  const purity = total > 0 ? stat.confirm / total : 0;
  const freshnessDays = getFreshnessDays(stat.lastConfirmed);
  const promoted =
    stat.confirm >= opts.minConfirm &&
    purity >= opts.minPurity &&
    freshnessDays <= opts.maxFreshnessDays &&
    stat.contradict === 0;

  return { promoted, purity, freshnessDays };
};

const buildEvidence = (
  field: 'type' | 'fromAccount',
  edgeKey: string,
  valueKey: string,
  stat: { confirm: number; contradict: number; lastConfirmed: string },
  purity: number,
  freshnessDays: number,
): PromotionEvidence => ({
  field,
  sourceKind: 'promoted_by_history',
  ruleId: `confidence_overlay:${field}`,
  edgeKey,
  valueKey,
  confirm: stat.confirm,
  contradict: stat.contradict,
  purity,
  freshnessDays,
  message: 'Promoted by historical confirmation overlay.',
});

export function applyFieldPromotionOverlay(context: PromotionOverlayContext): {
  promotedScores: Partial<Record<PromotableField, number>>;
  promotedFields: Partial<Record<PromotableField, 'promoted'>>;
  evidence: PromotionEvidence[];
} {
  if (!CONFIDENCE_OVERLAY_ENABLED) {
    return { promotedScores: {}, promotedFields: {}, evidence: [] };
  }

  const graph = getConfidenceGraph();
  const templateBase = getTemplateBase(context.senderHint, context.fields.fromAccount?.value);
  const accountToken = normalizeAccountToken(context.accountToken);
  const edgeKeys = buildEdgeKeysFromContext({
    vendor: context.vendor,
    templateHash: context.templateHash,
    templateBase,
    accountToken,
  });

  const promotedScores: Partial<Record<PromotableField, number>> = {};
  const promotedFields: Partial<Record<PromotableField, 'promoted'>> = {};
  const evidence: PromotionEvidence[] = [];

  const typeValue = (context.fields.type?.value || '').trim();
  if (typeValue && context.fields.type?.score === 0.7) {
    const candidateEdgeKeys = [edgeKeys.templateEdgeKey, edgeKeys.vendorEdgeKey].filter(Boolean) as string[];
    const hasStrongAnchor =
      Boolean(context.templateExactMatch) || context.fields.vendor?.sourceKind === 'direct_extract';

    if (hasStrongAnchor) {
      for (const edgeKey of candidateEdgeKeys) {
        const stat = getEdgeStat(graph, edgeKey, 'type', typeValue);
        if (!stat) continue;
        const evalResult = evaluatePromotion(stat, {
          minConfirm: 5,
          minPurity: 0.95,
          maxFreshnessDays: 90,
        });
        if (evalResult.promoted) {
          promotedScores.type = TYPE_PROMOTION_SCORE;
          promotedFields.type = 'promoted';
          evidence.push(
            buildEvidence('type', edgeKey, `type:${typeValue}`, stat, evalResult.purity, evalResult.freshnessDays),
          );
          break;
        }
      }
    }
  }

  const fromAccountValue = (context.fields.fromAccount?.value || '').trim();
  if (fromAccountValue && context.fields.fromAccount?.score === 0.3) {
    const candidateEdgeKeys = [edgeKeys.templateEdgeKey, edgeKeys.accountTokenEdgeKey].filter(Boolean) as string[];
    for (const edgeKey of candidateEdgeKeys) {
      const stat = getEdgeStat(graph, edgeKey, 'fromAccount', fromAccountValue);
      if (!stat) continue;
      const evalResult = evaluatePromotion(stat, {
        minConfirm: 7,
        minPurity: 0.98,
        maxFreshnessDays: 90,
      });
      if (evalResult.promoted) {
        promotedScores.fromAccount = FROM_ACCOUNT_PROMOTION_SCORE;
        promotedFields.fromAccount = 'promoted';
        evidence.push(
          buildEvidence(
            'fromAccount',
            edgeKey,
            `fromAccount:${fromAccountValue}`,
            stat,
            evalResult.purity,
            evalResult.freshnessDays,
          ),
        );
        break;
      }
    }
  }

  return { promotedScores, promotedFields, evidence };
}

export function recordFieldPromotionLearning(input: RecordLearningInput): void {
  const confirmedType = (input.confirmed.type || '').trim();
  const confirmedFromAccount = (input.confirmed.fromAccount || '').trim();
  if (!confirmedType && !confirmedFromAccount) return;

  const graph = getConfidenceGraph();
  const templateBase = getTemplateBase(input.senderHint, confirmedFromAccount);
  const accountToken = normalizeAccountToken(input.accountToken);
  const edgeKeys = buildEdgeKeysFromContext({
    vendor: normalizeVendorKey(input.vendor || ''),
    templateHash: input.templateHash,
    templateBase,
    accountToken,
  });

  if (confirmedType) {
    if (edgeKeys.templateEdgeKey) {
      recordConfirmation(graph, edgeKeys.templateEdgeKey, 'type', confirmedType);
    }
    if (edgeKeys.vendorEdgeKey) {
      recordConfirmation(graph, edgeKeys.vendorEdgeKey, 'type', confirmedType);
    }
  }

  if (confirmedFromAccount) {
    if (edgeKeys.templateEdgeKey) {
      recordConfirmation(graph, edgeKeys.templateEdgeKey, 'fromAccount', confirmedFromAccount);
    }
    if (edgeKeys.accountTokenEdgeKey) {
      recordConfirmation(graph, edgeKeys.accountTokenEdgeKey, 'fromAccount', confirmedFromAccount);
    }
  }

  saveConfidenceGraph(graph);
}
