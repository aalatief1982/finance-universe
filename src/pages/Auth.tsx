
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

export const Auth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await login();
    navigate('/');
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
