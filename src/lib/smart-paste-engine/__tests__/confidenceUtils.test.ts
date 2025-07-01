import { computeConfidenceScore } from '../confidenceUtils';

describe('computeConfidenceScore', () => {
  it('returns expected scores', () => {
    expect(computeConfidenceScore('direct')).toBe(1.0);
    expect(computeConfidenceScore('inferred')).toBe(0.7);
    expect(computeConfidenceScore('default')).toBe(0.3);
  });

  it('returns 0 for unknown source', () => {
    expect(computeConfidenceScore('other' as any)).toBe(0);
  });
});
