/**
 * @file template.ts
 * @description Type definitions for template.
 *
 * @module types/template
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

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

export interface TemplateMeta {
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
  successCount?: number;
  fallbackCount?: number;
}

export interface StructureTemplateEntry {
  id: string;
  structure: string;
  fields: string[];
  createdAt: string;
  updatedAt?: string;
  confidence?: number;
}
