
import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';

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

const ProfileForm: React.FC<ProfileFormProps> = ({
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
}) => {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <div>
        <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
        <Input 
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label>Gender <span className="text-red-500">*</span></Label>
        <RadioGroup 
          value={gender || ''} 
          onValueChange={(value) => setGender(value as 'male' | 'female')}
          className="flex space-x-4 mt-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="cursor-pointer">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="cursor-pointer">Female</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <Label htmlFor="birthDate">Date of Birth <span className="text-red-500">*</span></Label>
        <div className="mt-1">
          <DatePicker
            date={birthDate}
            setDate={setBirthDate}
            placeholder="Select your birth date"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email (Optional)</Label>
        <Input 
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="occupation">Occupation (Optional)</Label>
        <Input 
          id="occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Enter your occupation"
          className="mt-1"
        />
      </div>
    </motion.div>
  );
};

export default ProfileForm;
