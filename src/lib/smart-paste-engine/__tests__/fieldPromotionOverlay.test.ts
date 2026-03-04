import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyFieldPromotionOverlay } from '../fieldPromotionOverlay';
import { getConfidenceGraph, getTemplateEdgeKey, getVendorEdgeKey, saveConfidenceGraph } from '../confidenceGraph';

const mockNow = new Date('2025-03-01T12:00:00.000Z');

describe('fieldPromotionOverlay confidence graph', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  it('promotes type to 0.85 when strict template evidence exists', () => {
    vi.stubEnv('VITE_CONFIDENCE_OVERLAY_ENABLED', 'true');
    const graph = getConfidenceGraph();
    const edgeKey = getTemplateEdgeKey('alrajhi', 'tmpl-123');
    graph.templateEdges[edgeKey] = {
      'type:expense': { confirm: 5, contradict: 0, lastConfirmed: '2025-02-15' },
    };
    saveConfidenceGraph(graph);

    const result = applyFieldPromotionOverlay({
      senderHint: 'ALRAJHI',
      templateHash: 'tmpl-123',
      vendor: 'Amazon',
      templateExactMatch: true,
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBe(0.85);
    expect(result.promotedFields.type).toBe('promoted');
    expect(result.evidence[0]?.message).toContain('Promoted by historical confirmation overlay');
  });

  it('blocks type promotion when contradictions reduce purity below 0.95', () => {
    vi.stubEnv('VITE_CONFIDENCE_OVERLAY_ENABLED', 'true');
    const graph = getConfidenceGraph();
    const edgeKey = getTemplateEdgeKey('alrajhi', 'tmpl-123');
    graph.templateEdges[edgeKey] = {
      'type:expense': { confirm: 5, contradict: 1, lastConfirmed: '2025-02-15' },
    };
    saveConfidenceGraph(graph);

    const result = applyFieldPromotionOverlay({
      senderHint: 'ALRAJHI',
      templateHash: 'tmpl-123',
      vendor: 'Amazon',
      templateExactMatch: true,
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBeUndefined();
  });

  it('applies stricter fromAccount promotion only for template/account-token edges', () => {
    vi.stubEnv('VITE_CONFIDENCE_OVERLAY_ENABLED', 'true');
    const graph = getConfidenceGraph();
    const vendorEdge = getVendorEdgeKey('amazon');
    const templateEdge = getTemplateEdgeKey('alrajhi', 'tmpl-123');

    graph.vendorEdges[vendorEdge] = {
      'fromAccount:SAB': { confirm: 12, contradict: 0, lastConfirmed: '2025-02-20' },
    };

    let result = applyFieldPromotionOverlay({
      senderHint: 'ALRAJHI',
      templateHash: 'tmpl-123',
      vendor: 'Amazon',
      templateExactMatch: true,
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
    });

    expect(result.promotedScores.fromAccount).toBeUndefined();

    graph.templateEdges[templateEdge] = {
      'fromAccount:SAB': { confirm: 7, contradict: 0, lastConfirmed: '2025-02-20' },
    };
    saveConfidenceGraph(graph);

    result = applyFieldPromotionOverlay({
      senderHint: 'ALRAJHI',
      templateHash: 'tmpl-123',
      vendor: 'Amazon',
      templateExactMatch: true,
      fields: {
        fromAccount: { value: 'SAB', score: 0.3, source: 'default' },
      },
    });

    expect(result.promotedScores.fromAccount).toBe(0.85);
  });

  it('respects kill switch and prevents promotions when disabled', () => {
    vi.stubEnv('VITE_CONFIDENCE_OVERLAY_ENABLED', 'false');
    const graph = getConfidenceGraph();
    const edgeKey = getTemplateEdgeKey('alrajhi', 'tmpl-123');
    graph.templateEdges[edgeKey] = {
      'type:expense': { confirm: 10, contradict: 0, lastConfirmed: '2025-02-15' },
    };
    saveConfidenceGraph(graph);

    const result = applyFieldPromotionOverlay({
      senderHint: 'ALRAJHI',
      templateHash: 'tmpl-123',
      templateExactMatch: true,
      fields: {
        type: { value: 'expense', score: 0.7, source: 'inferred' },
      },
    });

    expect(result.promotedScores.type).toBeUndefined();
    expect(result.evidence).toEqual([]);
  });
});
