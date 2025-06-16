
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { XpensiaLogo } from '@/components/header/XpensiaLogo';

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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg text-center"
        >
          <div className="flex flex-col items-center mb-6">
            <XpensiaLogo className="h-16 w-16 mb-4" />
            <h1 className="text-4xl font-bold">Xpensia</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Every expense has a story. We help you see where your money goes and why.
          </p>
          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Register</Link>
            </Button>
          </div>
          
          <div className="mt-12 space-y-4 text-sm text-muted-foreground">
            <p>
              • Auto-categorize transactions from SMS
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
