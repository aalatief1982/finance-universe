import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/context/UserContext';
import { Phone, Loader2 } from 'lucide-react';

// Phone number validation schema
const formSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number'),
});

type FormValues = z.infer<typeof formSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUser, startPhoneVerification } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Start phone verification process
      const success = await startPhoneVerification(values.phoneNumber);
      
      if (success) {
        // Create basic user profile with phone number
        updateUser({
          id: `user_${Date.now()}`,
          phone: values.phoneNumber,
          phoneVerified: false,
          fullName: '',
          completedOnboarding: false
        });
        
        toast({
          title: 'Verification code sent',
          description: 'Please enter the verification code sent to your phone.',
        });
        
        // Navigate directly to the onboarding screen which will start with verification
        navigate('/onboarding');
      } else {
        toast({
          title: 'Verification failed',
          description: 'Could not send verification code. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout hideNavigation>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Register</CardTitle>
              <CardDescription>
                Enter your phone number to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
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
                        Sending verification code...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SignUp;
