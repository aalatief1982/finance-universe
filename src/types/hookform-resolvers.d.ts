/**
 * @file hookform-resolvers.d.ts
 * @description Type definitions for hookform-resolvers.d.
 *
 * @module types/hookform-resolvers.d
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

declare module '@hookform/resolvers/zod' {
  import { z } from 'zod';
  
  export function zodResolver<T extends z.ZodType<any, any>>(
    schema: T,
    schemaOptions?: z.ParseParams,
    factoryOptions?: { mode?: 'async' | 'sync' }
  ): (values: any) => Promise<{ values: any; errors: Record<string, any> }>;
}
