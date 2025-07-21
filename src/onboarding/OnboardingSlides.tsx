
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, MessageSquare, PieChart } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { Capacitor } from '@capacitor/core';
import { isPermissionOnboardingNeeded } from '@/utils/permission-flow-storage';
import PermissionsOnboarding from '@/components/onboarding/PermissionsOnboarding';

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onComplete }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [showPermissions, setShowPermissions] = useState(false);

  const slides = [
    {
      icon: TrendingUp,
      title: "Track Your Expenses",
      description: "Automatically categorize and track your spending with AI-powered insights",
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=600&fit=crop&crop=center",
    },
    {
      icon: MessageSquare,
      title: "SMS Integration",
      description: "Automatically detect expenses from your bank SMS messages",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop&crop=center",
    },
    {
      icon: PieChart,
      title: "Visual Analytics",
      description: "Beautiful charts and graphs to understand your spending patterns",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&crop=center",
    }
  ];

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const nextSlide = () => {
    if (current < slides.length - 1) {
      api?.scrollTo(current + 1);
    } else {
      handleSlidesComplete();
    }
  };

  const prevSlide = () => {
    if (current > 0) {
      api?.scrollTo(current - 1);
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <PermissionsOnboarding onComplete={onComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden rounded-2xl bg-card shadow-xl"
                >
                  {/* Image Background with Overlay */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-secondary/60" />
                    
                    {/* Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {(() => {
                        const IconComponent = slide.icon;
                        return <IconComponent className="h-20 w-20 text-primary-foreground drop-shadow-lg" />;
                      })()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-foreground">
                      {slide.title}
                    </h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                      {slide.description}
                    </p>
                    
                    {/* Progress Indicators */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      {slides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            idx === current ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={prevSlide}
                        disabled={current === 0}
                        className="flex-1 h-12"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={nextSlide}
                        className="flex-1 h-12"
                      >
                        {current === slides.length - 1 ? 'Get Started' : 'Next'}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default OnboardingSlides;
