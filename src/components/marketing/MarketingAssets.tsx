import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BrandTypography from '@/components/branding/BrandTypography';
import { cn } from '@/lib/utils';
import { COPY } from '@/components/copy/StandardizedCopy';
import { ArrowRight, CheckCircle, Star, TrendingUp, Shield, Zap } from 'lucide-react';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Smart Expense Tracking for Modern Life",
  subtitle = "Automate your expense tracking with AI-powered SMS parsing, intelligent categorization, and beautiful insights.",
  ctaText = "Get Started Free",
  onCtaClick,
  className
}) => {
  return (
    <section className={cn(
      "relative overflow-hidden bg-gradient-primary text-primary-foreground",
      "py-16 px-[var(--page-padding-x)]",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-primary-active opacity-90" />
      <div className="relative max-w-4xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 bg-white/10 text-white border-white/20">
          <Star className="w-3 h-3 mr-1" />
          New: AI-Powered SMS Parsing
        </Badge>
        
        <BrandTypography level="h1" className="text-4xl md:text-6xl font-bold mb-6 text-white">
          {title}
        </BrandTypography>
        
        <BrandTypography level="body" className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
          {subtitle}
        </BrandTypography>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={onCtaClick}
          >
            {ctaText}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10"
          >
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className
}) => {
  return (
    <Card className={cn("h-full hover:shadow-elegant transition-shadow", className)}>
      <CardContent className="p-[var(--card-padding)] text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <BrandTypography level="h3" className="mb-2">
          {title}
        </BrandTypography>
        <BrandTypography level="small" className="text-muted-foreground">
          {description}
        </BrandTypography>
      </CardContent>
    </Card>
  );
};

export const FeaturesSection: React.FC<{ className?: string }> = ({ className }) => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Parsing",
      description: "Automatically extract transaction details from bank SMS messages with 95% accuracy."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Beautiful charts and insights to understand your spending patterns and trends."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your financial data stays on your device. We prioritize your privacy and security."
    }
  ];

  return (
    <section className={cn("py-16 px-[var(--page-padding-x)]", className)}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <BrandTypography level="h2" className="mb-4">
            Everything you need to track expenses
          </BrandTypography>
          <BrandTypography level="body" className="text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make expense tracking effortless and insightful.
          </BrandTypography>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export const TestimonialSection: React.FC<{ className?: string }> = ({ className }) => {
  const testimonials: TestimonialProps[] = [
    {
      quote: "Xpensia has completely transformed how I track my expenses. The SMS parsing is incredibly accurate!",
      author: "Sarah Johnson",
      role: "Small Business Owner"
    },
    {
      quote: "Finally, an expense tracker that works with my lifestyle. Love the automatic categorization.",
      author: "Ahmed Al-Rashid",
      role: "Finance Professional"
    },
    {
      quote: "The insights have helped me save over $500 monthly. This app pays for itself!",
      author: "Maria Garcia",
      role: "Marketing Manager"
    }
  ];

  return (
    <section className={cn("py-16 px-[var(--page-padding-x)] bg-muted/30", className)}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <BrandTypography level="h2" className="mb-4">
            Loved by thousands of users
          </BrandTypography>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-[var(--card-padding)]">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <BrandTypography level="body" className="mb-4 italic">
                  "{testimonial.quote}"
                </BrandTypography>
                <div>
                  <BrandTypography level="small" className="font-medium">
                    {testimonial.author}
                  </BrandTypography>
                  <BrandTypography level="tiny" className="text-muted-foreground">
                    {testimonial.role}
                  </BrandTypography>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CtaSection: React.FC<{ 
  onGetStarted?: () => void;
  className?: string; 
}> = ({ onGetStarted, className }) => {
  return (
    <section className={cn(
      "py-16 px-[var(--page-padding-x)] bg-gradient-primary text-primary-foreground",
      className
    )}>
      <div className="max-w-4xl mx-auto text-center">
        <BrandTypography level="h2" className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Ready to take control of your finances?
        </BrandTypography>
        <BrandTypography level="body" className="text-xl mb-8 text-white/90">
          Join thousands of users who've simplified their expense tracking with Xpensia.
        </BrandTypography>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-white/90">
            <CheckCircle className="w-5 h-5" />
            <span>Free to start</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <CheckCircle className="w-5 h-5" />
            <span>No credit card required</span>
          </div>
        </div>
        <Button 
          size="lg" 
          className="bg-white text-primary hover:bg-white/90"
          onClick={onGetStarted}
        >
          {COPY.BUTTONS.NEXT}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};