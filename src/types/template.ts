export interface SmartPasteTemplate {
  id: string;
  template: string;
  fields: string[];
  defaultValues?: Record<string, string>;
  created: string;
  rawSample?: string;
  version?: string;
  hashAlgorithm?: string;
  meta?: TemplateMeta;
}

export type TemplateStatus = 'candidate' | 'learning' | 'ready' | 'deprecated';

export interface TemplateMeta {
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
  successCount?: number;
  fallbackCount?: number;
  confidenceScore?: number;          // 0-100 calculated score
  status?: TemplateStatus;           // Lifecycle status
  deprecationReason?: string;        // Why deprecated
  senderContext?: string;            // Original sender for context
  lastFailureAt?: string;            // Track recent failures
  userApprovedAt?: string;           // Manual approval timestamp
}

export interface StructureTemplateEntry {
  id: string;
  structure: string;
  fields: string[];
  createdAt: string;
  updatedAt?: string;
  confidence?: number;
}
