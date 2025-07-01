export function computeConfidenceScore(source: 'direct' | 'inferred' | 'default'): number {
  switch (source) {
    case 'direct':
      return 1.0;
    case 'inferred':
      return 0.7;
    case 'default':
      return 0.3;
    default:
      return 0;
  }
}
