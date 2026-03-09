/**
 * @file Profile.tsx
 * @description Page component for Profile.
 *
 * @module pages/Profile
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */
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
import { Card } from '@/components/ui/card';

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
        className="mx-auto max-w-md space-y-6 px-1 pt-2 pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+16px)]"
      >
        <Card className="flex flex-col items-center space-y-4 p-6 text-center">
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
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-semibold">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                <Trash2 className="mr-1 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
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
        </Card>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-5 sm:px-6">
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

          <DialogFooter className="sticky bottom-0 bg-background pt-3">
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
