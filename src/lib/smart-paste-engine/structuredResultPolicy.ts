import type { ParsedTransactionResult } from './parseAndInferTransaction';

/**
 * Keep structured parse output when it is materially useful, even if confidence
 * is below the standard review threshold.
 */
export function shouldKeepStructuredResult(result: ParsedTransactionResult): boolean {
  if (result.confidence >= 0.5 || result.parsed.matched) {
    return true;
  }

  const hasAmount = Boolean(result.parsed.directFields?.amount?.value);
  const hasCurrency = Boolean(result.parsed.directFields?.currency?.value);
  const hasVendor = Boolean(
    result.parsed.directFields?.vendor?.value || result.parsed.inferredFields?.vendor?.value,
  );

  return result.parsingStatus === 'partial' && hasAmount && hasCurrency && hasVendor;
}

