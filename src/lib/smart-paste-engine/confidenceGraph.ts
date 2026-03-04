import { safeStorage } from '@/utils/safe-storage';
import { normalizeVendorNameForCompare } from './vendorFallbackUtils';

export type GraphField = 'type' | 'fromAccount';

export type EdgeStat = {
  confirm: number;
  contradict: number;
  lastConfirmed: string;
};

export type Graph = {
  version: 1;
  vendorEdges: Record<string, Record<string, EdgeStat>>;
  templateEdges: Record<string, Record<string, EdgeStat>>;
  accountTokenEdges: Record<string, Record<string, EdgeStat>>;
};

export interface GraphContext {
  vendor?: string;
  templateHash?: string;
  templateBase?: string;
  accountToken?: string;
}

const STORE_KEY = 'xpensia_confidence_graph_v1';

const EMPTY_GRAPH: Graph = {
  version: 1,
  vendorEdges: {},
  templateEdges: {},
  accountTokenEdges: {},
};

const getStoreBucket = (graph: Graph, edgeKey: string): Record<string, Record<string, EdgeStat>> => {
  if (edgeKey.startsWith('vendor:')) return graph.vendorEdges;
  if (edgeKey.startsWith('tmpl:')) return graph.templateEdges;
  return graph.accountTokenEdges;
};

const toDayStamp = (): string => new Date().toISOString().slice(0, 10);

const ensureStat = (graph: Graph, edgeKey: string, valueKey: string): EdgeStat => {
  const bucket = getStoreBucket(graph, edgeKey);
  if (!bucket[edgeKey]) bucket[edgeKey] = {};
  if (!bucket[edgeKey][valueKey]) {
    bucket[edgeKey][valueKey] = { confirm: 0, contradict: 0, lastConfirmed: toDayStamp() };
  }
  return bucket[edgeKey][valueKey];
};

const getEdgeValues = (graph: Graph, edgeKey: string): Record<string, EdgeStat> => {
  const bucket = getStoreBucket(graph, edgeKey);
  if (!bucket[edgeKey]) bucket[edgeKey] = {};
  return bucket[edgeKey];
};

export const normalizeVendorKey = (vendor: string): string => normalizeVendorNameForCompare(vendor || '');

export const getVendorEdgeKey = (vendor: string): string => `vendor:${normalizeVendorKey(vendor)}`;

export const getTemplateEdgeKey = (base: string, templateHash: string): string =>
  `tmpl:${(base || 'unknown').trim().toLowerCase()}:${(templateHash || '').trim()}`;

export const getAccountTokenEdgeKey = (token: string): string => `accttok:${(token || '').trim().toLowerCase()}`;

export const getConfidenceGraph = (): Graph => {
  try {
    const raw = safeStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY_GRAPH };
    const parsed = JSON.parse(raw) as Partial<Graph>;
    if (parsed?.version !== 1) return { ...EMPTY_GRAPH };
    return {
      version: 1,
      vendorEdges: parsed.vendorEdges || {},
      templateEdges: parsed.templateEdges || {},
      accountTokenEdges: parsed.accountTokenEdges || {},
    };
  } catch {
    return { ...EMPTY_GRAPH };
  }
};

export const saveConfidenceGraph = (graph: Graph): void => {
  safeStorage.setItem(STORE_KEY, JSON.stringify(graph));
};

const toValueKey = (field: GraphField, value: string): string => `${field}:${(value || '').trim()}`;

const incrementConfirm = (graph: Graph, edgeKey: string, field: GraphField, value: string): void => {
  const valueKey = toValueKey(field, value);
  const stat = ensureStat(graph, edgeKey, valueKey);
  stat.confirm += 1;
  stat.lastConfirmed = toDayStamp();
};

export const recordContradictions = (
  graph: Graph,
  edgeKey: string,
  field: GraphField,
  selectedValue: string,
): void => {
  const values = getEdgeValues(graph, edgeKey);
  const selectedValueKey = toValueKey(field, selectedValue);
  Object.entries(values).forEach(([valueKey, stat]) => {
    if (!valueKey.startsWith(`${field}:`) || valueKey === selectedValueKey) return;
    stat.contradict += 1;
  });
};

export const recordConfirmation = (
  graph: Graph,
  edgeKey: string,
  field: GraphField,
  value: string,
): void => {
  incrementConfirm(graph, edgeKey, field, value);
  recordContradictions(graph, edgeKey, field, value);
};

export const getEdgeStat = (
  graph: Graph,
  edgeKey: string,
  field: GraphField,
  value: string,
): EdgeStat | null => {
  const values = getStoreBucket(graph, edgeKey)[edgeKey];
  if (!values) return null;
  return values[toValueKey(field, value)] || null;
};

export const buildEdgeKeysFromContext = (context: GraphContext): {
  vendorEdgeKey?: string;
  templateEdgeKey?: string;
  accountTokenEdgeKey?: string;
} => {
  const vendorKey = normalizeVendorKey(context.vendor || '');
  const templateHash = (context.templateHash || '').trim();
  const templateBase = (context.templateBase || 'unknown').trim().toLowerCase();
  const accountToken = (context.accountToken || '').trim().toLowerCase();

  return {
    vendorEdgeKey: vendorKey ? getVendorEdgeKey(vendorKey) : undefined,
    templateEdgeKey: templateHash ? getTemplateEdgeKey(templateBase, templateHash) : undefined,
    accountTokenEdgeKey: accountToken ? getAccountTokenEdgeKey(accountToken) : undefined,
  };
};
