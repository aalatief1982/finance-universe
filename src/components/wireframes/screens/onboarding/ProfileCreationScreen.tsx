
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import WireframeButton from '../../WireframeButton';

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
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your full name" 
                    {...field} 
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="you@example.com" 
                    {...field} 
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    type="tel"
                    placeholder="+1 (000) 000-0000" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
                {displayErrors.phone && !form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{displayErrors.phone}</p>
                )}
              </FormItem>
            )}
          />
          
          <div className="mt-6">
            <WireframeButton type="submit">Create Account</WireframeButton>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileCreationScreen;
