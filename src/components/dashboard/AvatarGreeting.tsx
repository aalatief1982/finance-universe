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
    <span className="inline-flex items-center gap-2 align-middle" aria-label="User greeting">
      <Avatar className="h-8 w-8">
        {avatar && <AvatarImage src={avatar} alt={firstName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="flex flex-col leading-tight">
        <span>{`${greeting}, ${firstName}`}</span>
        {tip && <span className="text-xs text-muted-foreground">{tip}</span>}
      </span>
    </span>
  );
};

export default AvatarGreeting;
