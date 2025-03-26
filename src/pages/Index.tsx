
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Expense Tracker App</CardTitle>
            <CardDescription className="text-center">
              Track your expenses effortlessly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Welcome to the Expense Tracker App, your personal finance assistant.
            </p>
            <div className="grid gap-4">
              <Button variant="default" className="w-full" onClick={() => {
                toast({
                  title: "Getting Started",
                  description: "Welcome to the Expense Tracker App!",
                });
              }}>
                Get Started
              </Button>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
