
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const Auth = () => {
  const { login, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the redirect path from location state or default to home
  const from = location.state?.from || '/';

  // If already authenticated, redirect to the intended page
  React.useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(from);
    }
  }, [authState.isAuthenticated, navigate, from]);

  const handleLogin = async () => {
    try {
      await login();
      
      // Store authentication in localStorage to persist between refreshes
      localStorage.setItem('auth', 'true');
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully"
      });
      
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "There was a problem logging in. Please try again."
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <Button onClick={handleLogin} className="w-full">
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};
