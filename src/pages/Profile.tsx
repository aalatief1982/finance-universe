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
import { useLanguage } from '@/i18n/LanguageContext';

const Profile = () => {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const { image, takeOrSelectPhoto, loading } = useProfileImage();
  const { t } = useLanguage();
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
      toast({ title: t('profile.fullNameRequired'), variant: 'destructive' });
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
    toast({ title: t('profile.updated'), description: t('profile.saved') });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };


  const handleDeleteAccount = () => {
    toast({
      title: t('profile.accountDeleted'),
      description: t('profile.accountDeletedDesc'),
      variant: 'destructive',
    });
    window.location.href = '/';
  };

  return (
    <Layout>
      <LoadingOverlay isOpen={loading} message={t('profile.loadingImage')} />
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
                alt={user?.fullName || t('profile.user')}
              />

              <AvatarFallback>{user?.fullName?.charAt(0) || t('profile.fallbackInitial')}</AvatarFallback>
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
            <h2 className="text-xl font-bold">{user?.fullName || t('profile.newUser')}</h2>
            <p className="text-muted-foreground">{user?.email || user?.phone || ''}</p>
          </div>

          <Button onClick={() => setIsEditing(true)}>{t('profile.editProfile')}</Button>
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-semibold">{t('profile.dangerZone')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('profile.deleteWarning')}
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                <Trash2 className="mr-1 h-4 w-4" />
                {t('profile.deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('profile.confirmDeleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('profile.confirmDeleteDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
                  {t('profile.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-5 sm:px-6">
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">

              <Label htmlFor="fullName">{t('profile.fullName')}<span className="text-red-500 ml-1">*</span></Label>

              <Input
                id="fullName"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleInputChange}
                placeholder={t('profile.enterFullName')}
              />
            </div>

            <div className="space-y-2">

              <Label htmlFor="email">{t('profile.email')}</Label>

              <Input
                id="email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
                placeholder={t('profile.enterEmail')}
              />
            </div>

            <div className="space-y-2">

              <Label htmlFor="phone">{t('profile.mobile')}</Label>

              <Input
                id="phone"
                name="phone"
                value={editFormData.phone}
                onChange={handleInputChange}
                placeholder={t('profile.enterMobile')}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-3">
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile}>{t('profile.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
