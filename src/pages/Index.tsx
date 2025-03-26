
import React from 'react';
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, TrendingUp, PieChart, Shield, CreditCard } from "lucide-react";
import Layout from "@/components/Layout";

const features = [
  {
    icon: <TrendingUp className="h-10 w-10 text-primary" />,
    title: "Track Expenses",
    description: "Monitor your daily spending with easy categorization and tagging."
  },
  {
    icon: <PieChart className="h-10 w-10 text-primary" />,
    title: "Visualize Data",
    description: "Get insights with beautiful charts and analytics on your spending habits."
  },
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: "Secure Storage",
    description: "Your financial data is encrypted and stored securely."
  },
  {
    icon: <CreditCard className="h-10 w-10 text-primary" />,
    title: "Budget Planning",
    description: "Set budgets and receive alerts when you're approaching limits."
  }
];

const Index = () => {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    Take Control of Your Finances
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                    Track expenses, analyze spending patterns, and reach your financial goals with our powerful expense tracker.
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 mt-6"
                >
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => {
                    toast({
                      title: "Demo Mode",
                      description: "Explore the app without signing up!",
                    });
                  }}>
                    Try Demo
                  </Button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center"
              >
                <div className="relative w-full max-w-md overflow-hidden rounded-lg shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
                    alt="Expense tracker dashboard"
                    className="w-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Features</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                Everything you need to manage your finances effectively
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover-scale">
                    <CardContent className="pt-6">
                      <div className="mb-4">{feature.icon}</div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6 sm:p-10 text-center">
                <CardTitle className="text-2xl sm:text-3xl mb-4">Ready to take control of your finances?</CardTitle>
                <CardDescription className="text-primary-foreground/90 text-lg mb-6">
                  Join thousands of users who have improved their financial health with our app.
                </CardDescription>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/signup">
                    Create a Free Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
