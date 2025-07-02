
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WireframeButton from '../../WireframeButton';
import { useToast } from '@/components/ui/use-toast';
import ProfileImageUploader from './profile/ProfileImageUploader';
import ProfileForm from './profile/ProfileForm';
import { ProfileData } from '@/types/user';

interface UserProfileScreenProps {
  onComplete: (profileData: ProfileData) => void;
}

const UserProfileScreen = ({ onComplete }: UserProfileScreenProps) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  
  const { toast } = useToast();
  
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
    
    const profileData: ProfileData = {
      image: profileImage || '/placeholder.svg',
      fullName,
      gender,
      birthDate,
      email: email || undefined,
      occupation: occupation || undefined,
      createdAt: new Date()
    };
    
    onComplete(profileData);
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
      
      <ProfileImageUploader
        profileImage={profileImage}
        setProfileImage={setProfileImage}
        fullName={fullName}
      />
      
      <ProfileForm
        fullName={fullName}
        setFullName={setFullName}
        gender={gender}
        setGender={setGender}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        email={email}
        setEmail={setEmail}
        occupation={occupation}
        setOccupation={setOccupation}
      />
      
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
