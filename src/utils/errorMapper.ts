/**
 * @file errorMapper.ts
 * @description Maps raw errors to user-friendly messages.
 *
 * @module utils/errorMapper
 *
 * @responsibilities
 * 1. Inspect error messages and return friendly copy
 * 2. Provide safe fallback for unknown errors
 *
 * @review-tags
 * - @risk: keyword matching may miss edge cases
 *
 * @review-checklist
 * - [ ] Permission/storage errors map to specific messages
 * - [ ] Unknown errors fall back to generic message
 */

export const getFriendlyMessage = (err: unknown): string => {
  const message = typeof err === 'string' ? err : (err as any)?.message ?? '';
  if (message.toLowerCase().includes('permission')) {
    return 'SMS permission is required to continue.';
  }
  if (message.toLowerCase().includes('storage')) {
    return 'There was a problem saving your data. Please try again.';
  }
  return 'Something went wrong. Please try again later.';
};
