/**
 * @file DashboardHeader.tsx
 * @description UI component for DashboardHeader.
 *
 * @module components/dashboard/DashboardHeader
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
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { User } from '@/types/user';

interface DashboardHeaderProps {
  user: User | null;
  setIsAddingExpense: (value: boolean) => void;
}

const DashboardHeader = ({ user, setIsAddingExpense }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">
        {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Dashboard'}
      </h1>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="gap-1 hidden sm:flex text-sm"
          size="sm"
          asChild
        >
          <Link to="/process-sms">
            <MessageSquare size={16} />
            Import SMS
          </Link>
        </Button>
        
        <Button 
          className="gap-1 text-sm" 
          size="sm"
          onClick={() => setIsAddingExpense(true)}
        >
          Add Transaction
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
