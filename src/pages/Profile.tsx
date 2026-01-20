import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useProfileImage } from '@/hooks/useProfileImage';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const Profile = () => {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const { image, takeOrSelectPhoto, loading } = useProfileImage();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar,
  });

  useEffect(() => {
    if (image) {
      updateUser({ avatar: image });
    }
  }, [image, updateUser]);

  const handleSaveProfile = () => {
    if (!editFormData.fullName.trim()) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return;
    }

    updateUser({
      fullName: editFormData.fullName,
      email: editFormData.email || undefined,
      phone: editFormData.phone || undefined,
      avatar: editFormData.avatar,
    });
    logAnalyticsEvent('profile_updated');
    setIsEditing(false);
    toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };


  const handleDeleteAccount = () => {
    toast({
      title: 'Account deleted',
      description: 'Your account has been permanently deleted.',
      variant: 'destructive',
    });
    window.location.href = '/';
  };

  return (
    <Layout>
      <LoadingOverlay isOpen={loading} message="Loading image..." />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="bg-card rounded-lg border p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">

              <AvatarImage
                src={image ?? (user?.avatar || '/placeholder.svg')}
                alt={user?.fullName || 'User'}
              />

              <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={takeOrSelectPhoto}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold">{user?.fullName || 'New User'}</h2>
            <p className="text-muted-foreground">{user?.email || user?.phone || ''}</p>
          </div>

          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        </div>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">

              <Label htmlFor="fullName">Full Name<span className="text-red-500 ml-1">*</span></Label>

              <Input
                id="fullName"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">

              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">

              <Label htmlFor="phone">Mobile</Label>

              <Input
                id="phone"
                name="phone"
                value={editFormData.phone}
                onChange={handleInputChange}
                placeholder="Enter your mobile number"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
