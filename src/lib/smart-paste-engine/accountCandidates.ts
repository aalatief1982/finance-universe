export interface AccountCandidate {
  value: string;
  labelHint: string;
  confidence: number;
  span?: { start: number; end: number };
}

interface AccountCandidatesDebug {
  anchors: number;
  scannedMatches: number;
}

const ANCHOR_PATTERN = /\b(card|acct|account|a\/c|iban|wallet|debit|credit|visa|mastercard|mada|hsbc|rajhi|alrajhi|stc)\b|بطاقة|حساب|رقم|عبر|الى|إلى|من|لصالح|لدى|مدى/gi;
const STRONG_LABEL_PATTERN = /^(بطاقة|حساب|account|acct|card)$/i;
const AMOUNT_KEYWORD_PATTERN = /\b(sar|usd|egp|amount|balance)\b|ريال|ر\.س|مبلغ|رصيد/i;
const DATE_LIKE_PATTERN = /\b\d{1,4}[/-]\d{1,2}([/-]\d{1,4})?\b/;
const TIME_LIKE_PATTERN = /\b\d{1,2}:\d{2}\b/;
const CANDIDATE_PATTERN = /\*{2,}\d{3,8}|\(\d{3,8}\)|\d{3,8}/g;

function normalizeText(rawMessage: string): string {
  return rawMessage.trim().replace(/\s+/g, ' ');
}

function isDateOrTimeLike(value: string): boolean {
  return DATE_LIKE_PATTERN.test(value) || TIME_LIKE_PATTERN.test(value);
}

function lengthBonus(value: string): number {
  const len = value.replace(/\D/g, '').length;
  if (len === 4) return 0.1;
  if (len === 3) return 0.05;
  if (len >= 5 && len <= 8) return 0.02;
  return 0;
}

export function extractAccountCandidates(rawMessage: string): {
  candidates: AccountCandidate[];
  debug?: AccountCandidatesDebug;
} {
  const normalized = normalizeText(rawMessage || '');
  if (!normalized) {
    return { candidates: [], debug: { anchors: 0, scannedMatches: 0 } };
  }

  const anchors: Array<{ label: string; start: number; end: number }> = [];
  ANCHOR_PATTERN.lastIndex = 0;
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = ANCHOR_PATTERN.exec(normalized)) !== null) {
    anchors.push({ label: anchorMatch[0], start: anchorMatch.index, end: anchorMatch.index + anchorMatch[0].length });
  }

  const allMatches: Array<{ rawValue: string; start: number; end: number }> = [];
  CANDIDATE_PATTERN.lastIndex = 0;
  let candidateMatch: RegExpExecArray | null;
  while ((candidateMatch = CANDIDATE_PATTERN.exec(normalized)) !== null) {
    allMatches.push({
      rawValue: candidateMatch[0],
      start: candidateMatch.index,
      end: candidateMatch.index + candidateMatch[0].length,
    });
  }

  const scored: AccountCandidate[] = [];

  anchors.forEach((anchor) => {
    allMatches.forEach((match) => {
      const anchorDistance = Math.min(Math.abs(match.start - anchor.end), Math.abs(anchor.start - match.end));
      if (anchorDistance > 30) return;

      const digits = match.rawValue.replace(/\D/g, '');
      if (!digits || digits.length > 12) return;
      if (isDateOrTimeLike(match.rawValue)) return;

      const localContext = normalized.slice(Math.max(0, match.start - 20), Math.min(normalized.length, match.end + 20));

      let confidence = 0.25;
      if (STRONG_LABEL_PATTERN.test(anchor.label)) confidence += 0.5;
      if (match.rawValue.startsWith('(') && match.rawValue.endsWith(')')) confidence += 0.2;
      if (/\*/.test(match.rawValue)) confidence += 0.2;
      if (AMOUNT_KEYWORD_PATTERN.test(localContext)) confidence -= 0.3;
      if (isDateOrTimeLike(localContext)) confidence -= 0.3;
      confidence += lengthBonus(match.rawValue);

      scored.push({
        value: /\*/.test(match.rawValue) ? match.rawValue : digits,
        labelHint: anchor.label,
        confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
        span: { start: match.start, end: match.end },
      });
    });
  });

  const deduped = new Map<string, AccountCandidate>();
  scored
    .sort((a, b) => b.confidence - a.confidence || a.value.localeCompare(b.value))
    .forEach((candidate) => {
      const existing = deduped.get(candidate.value);
      if (!existing || candidate.confidence > existing.confidence) {
        deduped.set(candidate.value, candidate);
      }
    });

  return {
    candidates: Array.from(deduped.values()).slice(0, 5),
    debug: { anchors: anchors.length, scannedMatches: scored.length },
  };
}
