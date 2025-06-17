import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types/user';

interface AvatarGreetingProps {
  user: User | null;
  tip?: string;
}

export const AvatarGreeting: React.FC<AvatarGreetingProps> = ({ user, tip }) => {
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const avatar = user?.avatar;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3" aria-label="User greeting">
      <Avatar>
        {avatar && <AvatarImage src={avatar} alt={firstName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{`${greeting}, ${firstName}`}</h1>
        {tip && <p className="text-xs text-muted-foreground">{tip}</p>}
      </div>
    </div>
  );
};

export default AvatarGreeting;
