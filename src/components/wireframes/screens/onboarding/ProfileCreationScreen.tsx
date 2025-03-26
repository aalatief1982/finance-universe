
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
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
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" })
});

const ProfileCreationScreen = ({ 
  onComplete, 
  userData, 
  onUpdateUserData,
  errors 
}: ProfileCreationScreenProps) => {
  const [localErrors, setLocalErrors] = useState<{[key: string]: string}>({});
  
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || ""
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onUpdateUserData(data);
    onComplete();
  };

  // For backward compatibility with the old error system
  const displayErrors = { ...errors, ...localErrors };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Create Your Profile</h3>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email Address</FormLabel>
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
