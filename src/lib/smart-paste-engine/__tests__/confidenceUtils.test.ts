import { computeConfidenceScore } from '../confidenceUtils';

describe('computeConfidenceScore', () => {
  it('returns 1.0 for direct', () => {
    expect(computeConfidenceScore('direct')).toBe(1.0);
  });

  it('returns 0.7 for inferred', () => {
    expect(computeConfidenceScore('inferred')).toBe(0.7);
  });

  it('returns 0.3 for default', () => {
    expect(computeConfidenceScore('default')).toBe(0.3);
  });
});
