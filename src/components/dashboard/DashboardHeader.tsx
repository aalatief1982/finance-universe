
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
      <h1 className="text-3xl font-bold tracking-tight">
        {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'Dashboard'}
      </h1>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="gap-1 hidden sm:flex"
          asChild
        >
          <Link to="/process-sms">
            <MessageSquare size={18} />
            Import SMS
          </Link>
        </Button>
        
        <Dialog open={false} onOpenChange={setIsAddingExpense}>
          <DialogTrigger asChild>
            <Button className="gap-1">Add Transaction</Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};

export default DashboardHeader;
