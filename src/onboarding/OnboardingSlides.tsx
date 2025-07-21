
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { TrendingUp, MessageSquare, PieChart, Shield, Smartphone, Target } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { isPermissionOnboardingNeeded } from '@/utils/permission-flow-storage';
import PermissionsOnboarding from '@/components/onboarding/PermissionsOnboarding';

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPermissions, setShowPermissions] = useState(false);

  const slides = [
    {
      icon: TrendingUp,
      title: "Track Your Expenses",
      description: "Automatically categorize and track your spending with AI-powered insights",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: MessageSquare,
      title: "SMS Integration",
      description: "Automatically detect expenses from your bank SMS messages",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: PieChart,
      title: "Visual Analytics",
      description: "Beautiful charts and graphs to understand your spending patterns",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays on your device. We never send your personal information to our servers.",
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleSlidesComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSlidesComplete = () => {
    // Check if we need to show permissions flow
    const isAndroid = Capacitor.getPlatform() === 'android';
    const needsPermissions = isPermissionOnboardingNeeded();
    
    if (isAndroid && needsPermissions) {
      setShowPermissions(true);
    } else {
      onComplete();
    }
  };

  if (showPermissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <PermissionsOnboarding onComplete={onComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              <div className={`h-48 bg-gradient-to-r ${slides[currentSlide].gradient} flex items-center justify-center`}>
                {(() => {
                  const IconComponent = slides[currentSlide].icon;
                  return <IconComponent className="h-16 w-16 text-white" />;
                })()}
              </div>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {slides[currentSlide].description}
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-8">
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={nextSlide}
                    className="flex-1"
                  >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingSlides;
