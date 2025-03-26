
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare, Shield, CreditCard, Wallet, User } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Profile = () => {
  // In a real app, you would fetch user data from your state management or API
  const user = {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '/placeholder.svg',
    smsProvidersConfigured: false
  };

  const menuItems = [
    {
      title: 'SMS Providers',
      description: 'Configure financial institutions for transaction tracking',
      icon: MessageSquare,
      link: '/sms-providers',
      status: user.smsProvidersConfigured ? 'Configured' : 'Not configured',
      statusColor: user.smsProvidersConfigured ? 'text-green-500' : 'text-amber-500'
    },
    {
      title: 'Privacy & Security',
      description: 'Manage your security settings',
      icon: Shield,
      link: '/settings',
      status: 'Secure',
      statusColor: 'text-green-500'
    },
    {
      title: 'Payment Methods',
      description: 'Manage your cards and payment options',
      icon: CreditCard,
      link: '/settings',
      status: 'Not configured',
      statusColor: 'text-amber-500'
    },
    {
      title: 'Account Settings',
      description: 'Update your personal information',
      icon: User,
      link: '/settings',
      status: '',
      statusColor: ''
    },
    {
      title: 'Currency Preferences',
      description: 'Set your default currency and conversion options',
      icon: Wallet,
      link: '/settings',
      status: 'USD',
      statusColor: 'text-foreground'
    }
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>
        
        <div className="bg-card rounded-lg border p-6 flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
        </div>
        
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link 
                to={item.link}
                className="flex items-center justify-between p-4 bg-card hover:bg-secondary rounded-lg border transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                    <item.icon className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {item.status && (
                    <span className={`text-sm mr-2 ${item.statusColor}`}>{item.status}</span>
                  )}
                  <ChevronRight className="text-muted-foreground" size={18} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
        {!user.smsProvidersConfigured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3"
          >
            <h3 className="font-semibold">Complete Your Setup</h3>
            <p className="text-sm text-muted-foreground">
              Configure SMS providers to enable automatic expense tracking from your financial institutions.
            </p>
            <Button asChild>
              <Link to="/sms-providers">Configure SMS Providers</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Profile;
