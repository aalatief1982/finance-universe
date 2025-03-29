
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

const Index = () => {
  const { auth } = useUser();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [auth.isAuthenticated, navigate]);

  return (
    <Layout hideNavigation>
      <div className="min-h-[90vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg text-center"
        >
          <h1 className="text-4xl font-bold mb-6">Expense Tracker</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Automatically analyze your expenses through SMS messages and gain insights into your spending patterns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
          
          <div className="mt-12 space-y-4 text-sm text-muted-foreground">
            <p>
              • Automatically categorize transactions from SMS
            </p>
            <p>
              • Track spending across multiple accounts
            </p>
            <p>
              • Visualize your financial trends
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Index;
