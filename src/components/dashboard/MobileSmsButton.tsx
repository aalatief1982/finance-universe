
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
        <Link to="/process-sms">
          <MessageSquare size={18} />
          Import Transactions from SMS
        </Link>
      </Button>
    </div>
  );
};

export default MobileSmsButton;
