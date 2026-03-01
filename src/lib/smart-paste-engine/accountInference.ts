export interface AccountInferenceCandidate {
  value: string;
  score: number;
  reasons: string[];
  anchor?: string;
  index: number;
}

export interface PickAccountCandidateContext {
  senderHint?: string;
  rawMessage?: string;
}

const ACCOUNT_ANCHOR_PATTERN = /\b(account|acct|a\/c|acc|card|ending|last|iban|wallet|from|to|debit|credit)\b|حساب|بطاقة|رقم|من|الى|إلى|لدى|عبر|مدى/gi;
const STRONG_ACCOUNT_ANCHOR = /^(account|acct|a\/c|card|حساب|بطاقة)$/i;
const CANDIDATE_TOKEN_PATTERN = /\*{2,}\d{3,8}|x{2,}\d{3,8}|X{2,}\d{3,8}|\d{3,8}/g;
const AMOUNT_CONTEXT_PATTERN = /\b(amount|amt|balance|sar|usd|egp)\b|مبلغ|رصيد|ر\.س|ريال/i;
const DATE_TIME_PATTERN = /\b\d{1,4}[/-]\d{1,2}([/-]\d{1,4})?\b|\b\d{1,2}:\d{2}\b/;

function normalizeMessage(rawMessage: string): string {
  return (rawMessage || '').replace(/\s+/g, ' ').trim();
}

export function extractAccountCandidates(rawMessage: string, senderHint?: string): AccountInferenceCandidate[] {
  const normalized = normalizeMessage(rawMessage);
  if (!normalized) return [];

  const anchors: Array<{ label: string; start: number; end: number }> = [];
  ACCOUNT_ANCHOR_PATTERN.lastIndex = 0;
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = ACCOUNT_ANCHOR_PATTERN.exec(normalized)) !== null) {
    anchors.push({
      label: anchorMatch[0],
      start: anchorMatch.index,
      end: anchorMatch.index + anchorMatch[0].length,
    });
  }

  const tokens: Array<{ raw: string; start: number; end: number }> = [];
  CANDIDATE_TOKEN_PATTERN.lastIndex = 0;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = CANDIDATE_TOKEN_PATTERN.exec(normalized)) !== null) {
    tokens.push({
      raw: tokenMatch[0],
      start: tokenMatch.index,
      end: tokenMatch.index + tokenMatch[0].length,
    });
  }

  const candidates: AccountInferenceCandidate[] = [];

  tokens.forEach((token) => {
    const digits = token.raw.replace(/\D/g, '');
    if (digits.length < 3 || digits.length > 8) return;
    if (DATE_TIME_PATTERN.test(token.raw)) return;

    const nearbyAnchor = anchors
      .map((anchor) => ({
        anchor,
        distance: Math.min(Math.abs(token.start - anchor.end), Math.abs(anchor.start - token.end)),
      }))
      .filter((item) => item.distance <= 28)
      .sort((a, b) => a.distance - b.distance)[0];

    // Base score is intentionally low: this is only a best-guess, not final truth.
    let score = 0.22;
    const reasons: string[] = [];

    if (nearbyAnchor) {
      // Reward proximity to account-like labels in Arabic/English.
      score += 0.35;
      reasons.push(`near-anchor:${nearbyAnchor.anchor.label}`);
      if (STRONG_ACCOUNT_ANCHOR.test(nearbyAnchor.anchor.label)) {
        score += 0.15;
        reasons.push('strong-anchor');
      }
    }

    if (/[*xX]/.test(token.raw)) {
      // Masked tokens are common in card/account SMS and usually safer than plain numbers.
      score += 0.2;
      reasons.push('masked-pattern');
    }

    if (digits.length === 4) {
      score += 0.08;
      reasons.push('last4-shape');
    }

    const localContext = normalized.slice(Math.max(0, token.start - 16), Math.min(normalized.length, token.end + 16));
    if (AMOUNT_CONTEXT_PATTERN.test(localContext)) {
      score -= 0.22;
      reasons.push('amount-like-context');
    }

    if (DATE_TIME_PATTERN.test(localContext)) {
      score -= 0.18;
      reasons.push('date-time-context');
    }

    if (senderHint && nearbyAnchor) {
      score += 0.03;
      reasons.push('sender+anchor-context');
    }

    candidates.push({
      value: /[*xX]/.test(token.raw) ? token.raw : digits,
      score: Number(Math.max(0, Math.min(1, score)).toFixed(3)),
      reasons,
      anchor: nearbyAnchor?.anchor.label,
      index: token.start,
    });
  });

  const bestByValue = new Map<string, AccountInferenceCandidate>();
  candidates
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .forEach((candidate) => {
      const existing = bestByValue.get(candidate.value);
      if (!existing || candidate.score > existing.score) {
        bestByValue.set(candidate.value, candidate);
      }
    });

  return Array.from(bestByValue.values()).slice(0, 6);
}

export function pickBestAccountCandidate(
  candidates: AccountInferenceCandidate[],
  ctx: PickAccountCandidateContext = {},
): AccountInferenceCandidate | undefined {
  if (!candidates.length) return undefined;

  const ranked = [...candidates].sort((a, b) => {
    const aMasked = /[*xX]/.test(a.value) ? 1 : 0;
    const bMasked = /[*xX]/.test(b.value) ? 1 : 0;
    return b.score - a.score || bMasked - aMasked || a.index - b.index;
  });

  const top = ranked[0];
  const minScore = ctx.senderHint ? 0.3 : 0.35;
  if (top.score < minScore) return undefined;

  return top;
}
