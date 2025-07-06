import { useEffect, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

const PROFILE_IMAGE_KEY = 'profileImagePath';

export function useProfileImage() {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    loadSavedImage();
  }, []);

  const takeOrSelectPhoto = async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      quality: 80
    });

    const base64Data = await convertWebPathToBase64(photo.webPath!);

    const fileName = 'profile.jpg';

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    localStorage.setItem(PROFILE_IMAGE_KEY, fileName);
    setImage(`data:image/jpeg;base64,${base64Data}`);
    FirebaseAnalytics.logEvent({ name: 'photo_added' });
  };

  const loadSavedImage = async () => {
    const fileName = localStorage.getItem(PROFILE_IMAGE_KEY);
    if (!fileName) return;

    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data
      });
      setImage(`data:image/jpeg;base64,${result.data}`);
    } catch (err) {
      console.error('Failed to load profile image:', err);
      setImage(null);
    }
  };

  return {
    image,              // base64 string to be used as <img src={image} />
    takeOrSelectPhoto   // call this to update profile image
  };
}

async function convertWebPathToBase64(webPath: string): Promise<string> {
  const response = await fetch(webPath);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) resolve(base64);
      else reject('Unable to convert image to base64');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
