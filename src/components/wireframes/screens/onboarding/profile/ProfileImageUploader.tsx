
import React from 'react';
import { Camera, Upload, X, User2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface ProfileImageUploaderProps {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  fullName: string;
}

const ProfileImageUploader = ({ profileImage, setProfileImage, fullName }: ProfileImageUploaderProps) => {
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
  );
};

export default ProfileImageUploader;
