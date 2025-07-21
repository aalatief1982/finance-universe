
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { TrendingUp, MessageSquare, PieChart } from 'lucide-react';
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
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=600&fit=crop&crop=center",
      gradient: "from-blue-500/80 to-purple-600/80"
    },
    {
      icon: MessageSquare,
      title: "SMS Integration",
      description: "Automatically detect expenses from your bank SMS messages",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop&crop=center",
      gradient: "from-green-500/80 to-teal-600/80"
    },
    {
      icon: PieChart,
      title: "Visual Analytics",
      description: "Beautiful charts and graphs to understand your spending patterns",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&crop=center",
      gradient: "from-orange-500/80 to-red-600/80"
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
        <Carousel className="w-full">
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden rounded-2xl bg-white shadow-2xl"
                >
                  {/* Image Background with Overlay */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
                    
                    {/* Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {(() => {
                        const IconComponent = slide.icon;
                        return <IconComponent className="h-20 w-20 text-white drop-shadow-lg" />;
                      })()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">
                      {slide.title}
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      {slide.description}
                    </p>
                    
                    {/* Progress Indicators */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      {slides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === currentSlide ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className="flex-1 h-12"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={nextSlide}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Carousel Navigation - Hidden by default, controlled by our custom buttons */}
          <CarouselPrevious className="hidden" />
          <CarouselNext className="hidden" />
        </Carousel>
      </div>
    </div>
  );
};

export default OnboardingSlides;
