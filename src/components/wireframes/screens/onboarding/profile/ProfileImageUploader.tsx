
import React, { useState } from 'react';
import { Camera, User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ProfileImageUploaderProps {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  fullName: string;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  profileImage,
  setProfileImage,
  fullName,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const takePicture = async () => {
    try {
      if (!isNative) {
        // Web fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Native camera implementation
      setIsUploading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
      });

      if (image.dataUrl) {
        setProfileImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to take picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      if (!isNative) {
        // Web fallback
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      // Native photo library implementation
      setIsUploading(true);
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        setProfileImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      toast({
        title: 'Gallery Error',
        description: 'Failed to select image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border mb-4 relative"
      >
        {profileImage ? (
          <img 
            src={profileImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={takePicture}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isNative ? 'Camera' : 'Upload'}
        </Button>
        
        {isNative && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={selectFromGallery}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Gallery
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUploader;
