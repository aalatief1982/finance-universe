/**
 * @file DemoBanner.tsx
 * @description Sticky banner shown when app is in demo mode.
 * Disappears automatically when user exits demo mode.
 */

import React from 'react';
import { FlaskConical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/hooks/useDemoMode';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, exitDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div
      className="relative z-50 flex items-center justify-between gap-2 px-4 py-2 text-sm"
      style={{
        background: 'hsl(var(--warning))',
        color: 'hsl(var(--warning-foreground))',
      }}
      role="status"
      aria-label="Demo mode active"
    >
      <div className="flex items-center gap-2 font-medium">
        <FlaskConical size={15} className="shrink-0" />
        <span>You're viewing demo data — add your first transaction to get started</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={exitDemoMode}
        className="h-7 shrink-0 gap-1 rounded-md px-2 text-xs font-semibold hover:bg-black/10"
        style={{ color: 'hsl(var(--warning-foreground))' }}
        aria-label="Exit demo mode"
      >
        <X size={13} />
        Exit Demo
      </Button>
    </div>
  );
};
