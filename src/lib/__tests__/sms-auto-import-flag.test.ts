import { describe, expect, it } from 'vitest';
import { SMS_AUTO_IMPORT_ENABLED } from '@/lib/env';
import { SMS_STARTUP_IMPORT_ENABLED } from '@/lib/envFlags';

describe('SMS auto-import kill switch', () => {
  it('keeps the master kill-switch disabled', () => {
    expect(SMS_AUTO_IMPORT_ENABLED).toBe(false);
  });

  it('forces startup import trigger to remain disabled', () => {
    expect(SMS_STARTUP_IMPORT_ENABLED).toBe(false);
  });
});
