
import React, { useState } from 'react';
import { Calendar, Mail, Briefcase, User2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface ProfileFormProps {
  fullName: string;
  setFullName: (name: string) => void;
  gender: 'male' | 'female' | null;
  setGender: (gender: 'male' | 'female' | null) => void;
  birthDate: Date | null;
  setBirthDate: (date: Date | null) => void;
  email: string;
  setEmail: (email: string) => void;
  occupation: string;
  setOccupation: (occupation: string) => void;
}

const ProfileForm = ({
  fullName,
  setFullName,
  gender,
  setGender,
  birthDate,
  setBirthDate,
  email,
  setEmail,
  occupation,
  setOccupation
}: ProfileFormProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="full-name">Full Name</Label>
        <Input
          id="full-name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      
      <div>
        <Label>Gender</Label>
        <div className="flex space-x-2 mt-1">
          <Button
            type="button"
            variant={gender === 'male' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setGender('male')}
          >
            Male
          </Button>
          <Button
            type="button"
            variant={gender === 'female' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setGender('female')}
          >
            Female
          </Button>
        </div>
      </div>
      
      <div>
        <Label htmlFor="birth-date">Birth Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="birth-date"
              variant="outline"
              className="w-full justify-start text-left font-normal mt-1"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {birthDate ? format(birthDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={birthDate || undefined}
              onSelect={(date) => {
                setBirthDate(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
              disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <Label htmlFor="occupation">Occupation</Label>
        <div className="flex items-center mt-1 relative">
          <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3" />
          <Input
            id="occupation"
            placeholder="Enter your occupation"
            className="pl-10"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email (Optional)</Label>
        <div className="flex items-center mt-1 relative">
          <Mail className="w-4 h-4 text-muted-foreground absolute left-3" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
