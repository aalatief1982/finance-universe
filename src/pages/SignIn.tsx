
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';
import { Phone, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneVerification from '@/components/auth/PhoneVerification';

const formSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
});

type FormValues = z.infer<typeof formSchema>;

const SignIn = () => {
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, auth } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    // Store the phone number and show verification component
    setShowVerification(true);
    setIsLoading(false);
  };

  const handleVerificationComplete = () => {
    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
    
    // Check if user needs to complete onboarding
    if (user?.completedOnboarding) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {!showVerification ? (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
                <CardDescription>
                  Enter your phone number to sign in to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <div className="flex items-center">
                                <Phone className="absolute left-3 text-muted-foreground" size={16} />
                                <Input 
                                  className="pl-10" 
                                  placeholder="+1 (123) 456-7890" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : "Continue"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="text-sm text-muted-foreground text-center">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <PhoneVerification 
              onVerificationComplete={handleVerificationComplete} 
            />
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default SignIn;
