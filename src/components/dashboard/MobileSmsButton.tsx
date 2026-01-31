/**
 * @file MobileSmsButton.tsx
 * @description UI component for MobileSmsButton.
 *
 * @module components/dashboard/MobileSmsButton
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

const MobileSmsButton = () => {
  return (
    <div className="sm:hidden">
      <Button 
        variant="outline" 
        className="w-full gap-1 mb-4"
        asChild
      >
        <Link to="/import-transactions">
          <MessageSquare size={18} />
          Paste & Parse
        </Link>
      </Button>
    </div>
  );
};

export default MobileSmsButton;
