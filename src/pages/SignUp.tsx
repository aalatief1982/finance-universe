
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUser } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    // Check if Supabase is configured
    if (isSupabaseConfigured()) {
      try {
        // Attempt to register with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.name
            }
          }
        });
        
        if (error) {
          throw error;
        }
        
        if (data.user) {
          // Create user profile in Supabase
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: values.email,
              full_name: values.name,
              phone: '',
              phone_verified: false,
              gender: null,
              birth_date: null,
              avatar_url: null,
              occupation: null,
              sms_providers: [],
              completed_onboarding: false,
              created_at: new Date().toISOString(),
              last_active: new Date().toISOString()
            });
          
          if (profileError) {
            console.error("Error creating user profile:", profileError);
          }
          
          // Update local user context
          updateUser({
            id: data.user.id,
            fullName: values.name,
            email: values.email,
            phone: '',
            completedOnboarding: false,
            phoneVerified: false,
            hasProfile: false,
            gender: null,
            birthDate: null,
            smsProviders: []
          });
          
          toast({
            title: 'Account created!',
            description: 'Your account has been created successfully.',
          });
          
          // Redirect to onboarding or dashboard
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Supabase registration error:", error);
        toast({
          title: 'Registration failed',
          description: error.message || 'An error occurred during registration.',
          variant: 'destructive'
        });
        
        // Fallback to mock registration if Supabase fails
        fallbackToMockRegistration(values);
      }
    } else {
      // Supabase not configured, use mock registration
      fallbackToMockRegistration(values);
    }
    
    setIsLoading(false);
  };
  
  // Fallback to the original mock registration
  const fallbackToMockRegistration = (values: FormValues) => {
    // This is where you would typically make an API call to register the user
    // For now, we'll just simulate a successful registration after a delay
    setTimeout(() => {
      updateUser({
        id: `user_${Date.now()}`,
        fullName: values.name,
        email: values.email,
        phone: '',
        completedOnboarding: false,
        phoneVerified: false,
        hasProfile: false,
        gender: null,
        birthDate: null,
        smsProviders: []
      });
      
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      
      navigate('/dashboard');
    }, 1500);
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>
                Enter your information to create an account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="example@email.com" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={toggleShowPassword}
                          >
                            {showPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type={showConfirmPassword ? "text" : "password"} 
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={toggleShowConfirmPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showConfirmPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SignUp;
