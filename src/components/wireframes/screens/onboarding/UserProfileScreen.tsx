
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, UserRound, Calendar, Mail, X, User2 } from 'lucide-react';
import WireframeButton from '../../WireframeButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserProfileScreenProps {
  onComplete: (profileData: any) => void;
}

const UserProfileScreen = ({ onComplete }: UserProfileScreenProps) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  
  const handleImageUpload = () => {
    // In a real app, this would use native file picker
    // For the wireframe, we'll use a placeholder image
    setProfileImage('/placeholder.svg');
    
    toast({
      title: "Image uploaded",
      description: "Profile image has been updated"
    });
  };
  
  const handleSubmit = () => {
    if (!fullName) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive"
      });
      return;
    }
    
    if (!gender) {
      toast({
        title: "Error",
        description: "Please select your gender",
        variant: "destructive"
      });
      return;
    }
    
    if (!birthDate) {
      toast({
        title: "Error",
        description: "Please select your birth date",
        variant: "destructive"
      });
      return;
    }
    
    const profileData = {
      image: profileImage || '/placeholder.svg',
      fullName,
      gender,
      birthDate,
      email: email || undefined,
      createdAt: new Date()
    };
    
    onComplete(profileData);
  };
  
  const removeImage = () => {
    setProfileImage(null);
  };
  
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Create Your Profile</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us a bit about yourself to get started
        </p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          {profileImage ? (
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileImage} alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(fullName) || <User2 className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <button 
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                onClick={removeImage}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarFallback className={cn(
                "bg-primary/10 text-primary text-xl",
                !fullName && "bg-muted"
              )}>
                {getInitials(fullName) || <User2 className="h-10 w-10 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex space-x-2 mb-6">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={handleImageUpload}
          >
            <Camera size={16} />
            <span>Camera</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={handleImageUpload}
          >
            <Upload size={16} />
            <span>Upload</span>
          </Button>
        </div>
      </div>
      
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
      
      <div className="pt-4">
        <WireframeButton 
          onClick={handleSubmit}
          variant="primary"
          className="w-full"
        >
          Continue
        </WireframeButton>
      </div>
    </motion.div>
  );
};

export default UserProfileScreen;
