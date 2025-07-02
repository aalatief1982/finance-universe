export type ScoreSource = 'direct' | 'inferred' | 'default';

export function computeConfidenceScore(source: ScoreSource): number {
  switch (source) {
    case 'direct':
      return 1;
    case 'inferred':
      return 0.5;
    case 'default':
      return 0.2;
    default:
      return 0;
  }
}
