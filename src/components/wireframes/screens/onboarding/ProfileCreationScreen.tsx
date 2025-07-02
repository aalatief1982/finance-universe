
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { User, Camera, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female';
  birthDate?: Date;
  profileImage?: string;
}

interface ProfileCreationScreenProps {
  onComplete: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
  errors: {[key: string]: string};
}

// Create a schema for form validation
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional().or(z.literal('')),
  phone: z.string().min(1, { message: "Phone number is required" }),
  gender: z.enum(['male', 'female']).optional(),
  birthDate: z.date().optional(),
  profileImage: z.string().optional()
});

const ProfileCreationScreen = ({ 
  onComplete, 
  userData, 
  onUpdateUserData,
  errors 
}: ProfileCreationScreenProps) => {
  const [localErrors, setLocalErrors] = useState<{[key: string]: string}>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      gender: userData.gender,
      birthDate: userData.birthDate,
      profileImage: userData.profileImage
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onUpdateUserData(data);
    onComplete();
  };

  // Mock function for selecting profile image
  const handleImageSelect = () => {
    // In a real app, this would open the camera or file picker
    const mockImageUrl = "https://i.pravatar.cc/150?img=" + Math.floor(Math.random() * 70);
    setAvatarPreview(mockImageUrl);
    form.setValue('profileImage', mockImageUrl);
  };

  // For backward compatibility with the old error system
  const displayErrors = { ...errors, ...localErrors };

  // Extract values from form
  const watchGender = form.watch('gender');
  const watchBirthDate = form.watch('birthDate');
  const watchProfileImage = form.watch('profileImage');

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 cursor-pointer" onClick={handleImageSelect}>
            <AvatarImage src={avatarPreview || watchProfileImage} />
            <AvatarFallback className="bg-primary/10">
              <User className="h-12 w-12 text-primary" />
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleImageSelect}
          >
            <Camera className="h-4 w-4" />
            <span>Add Photo</span>
          </Button>
        </div>
        <h3 className="text-lg font-medium mt-4">Create Your Profile</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us a bit about yourself to personalize your experience
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your full name" 
                    {...field} 
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
                {displayErrors.name && !form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{displayErrors.name}</p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Gender</FormLabel>
                <div className="flex gap-3 mt-1">
                  <Button
                    type="button"
                    variant={field.value === 'male' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1",
                      field.value === 'male' ? 'bg-blue-500 text-white' : ''
                    )}
                    onClick={() => form.setValue('gender', 'male')}
                  >
                    Male
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'female' ? 'default' : 'outline'}
                    className={cn(
                      "flex-1",
                      field.value === 'female' ? 'bg-pink-500 text-white' : ''
                    )}
                    onClick={() => form.setValue('gender', 'female')}
                  >
                    Female
                  </Button>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium">Birth Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 h-11 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select your birth date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email Address <span className="text-muted-foreground">(Optional)</span></FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="you@example.com" 
                    {...field} 
                    className="h-11"
                  />
                </FormControl>
                <FormMessage />
                {displayErrors.email && !form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{displayErrors.email}</p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="+1 (000) 000-0000" 
                    {...field} 
                    className="h-11"
                    disabled={userData.phone ? true : false}
                  />
                </FormControl>
                <FormMessage />
                {field.value && (
                  <p className="text-green-500 text-xs">✓ Phone verified</p>
                )}
                {displayErrors.phone && !form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{displayErrors.phone}</p>
                )}
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <WireframeButton 
              type="submit" 
              variant="primary"
              className="w-full"
            >
              Create Account
            </WireframeButton>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

export default ProfileCreationScreen;
