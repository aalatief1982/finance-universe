import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectFade } from 'swiper/modules';
import { ArrowRight, Zap, Brain, PieChart } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const slides: Slide[] = [
  {
    image: '/assets/onboarding1-1.png',
    title: 'Track Expenses Instantly',
    subtitle: 'Smart parsing of SMS in seconds',
    description: 'Never miss a transaction. Our AI automatically reads your SMS notifications and tracks every expense.',
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-primary/20 via-primary/10 to-transparent'
  },
  {
    image: '/assets/onboarding2-2.png',
    title: 'Auto-Categorized for You',
    subtitle: 'No setup needed, we learn as you go!',
    description: 'Intelligent categorization that gets smarter with every transaction. Spend time living, not organizing.',
    icon: <Brain className="w-8 h-8" />,
    gradient: 'from-secondary/20 via-secondary/10 to-transparent'
  },
  {
    image: '/assets/onboarding3-3.png',
    title: 'See Where Your Money Goes',
    subtitle: 'Real-time dashboards & easy reports',
    description: 'Beautiful insights and reports that help you make informed financial decisions instantly.',
    icon: <PieChart className="w-8 h-8" />,
    gradient: 'from-accent/20 via-accent/10 to-transparent'
  }
];

interface Props {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<Props> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* Progress indicator */}
      <div className="absolute top-0 z-10 left-1/2 transform -translate-x-1/2 pt-4 safe-area-inset-top">
        <div className="flex space-x-2 pt-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index 
                  ? 'w-8 bg-primary' 
                  : i < index 
                    ? 'w-2 bg-primary/60' 
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <Swiper
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        pagination={{ 
          clickable: true,
          bulletClass: 'swiper-pagination-bullet opacity-60',
          bulletActiveClass: 'swiper-pagination-bullet-active opacity-100 !bg-primary'
        }}
        modules={[Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        className="h-full"
        speed={600}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className={`flex flex-col h-full min-h-0 transition-all duration-700 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
              {/* Header with icon and gradient */}
              <div className={`relative pt-16 pb-4 bg-gradient-to-b ${slide.gradient} shrink-0`}>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="mb-3 p-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                    <div className="text-primary">
                      {slide.icon}
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 animate-slide-up">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg font-medium text-primary mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {slide.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {slide.description}
                  </p>
                </div>
              </div>

              {/* Image section */}
              <div className="flex-1 flex items-center justify-center px-4 min-h-0">
                <div className="relative w-full max-w-xs h-full max-h-[40vh] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl transform rotate-1" />
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 shadow-xl w-full h-fit">
                    <img
                      src={slide.image.trim()}
                      alt={slide.title}
                      className="w-full h-auto max-h-[35vh] object-contain rounded-lg animate-scale-in"
                      style={{ animationDelay: '0.3s' }}
                      onError={
                        import.meta.env.MODE === 'development'
                          ? () => console.error(`Failed to load image: ${slide.image}`)
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Action section */}
              <div className="px-4 pb-4 safe-area-inset-bottom pt-2 shrink-0">
                {i === slides.length - 1 ? (
                  <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <Button 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group" 
                      onClick={onComplete}
                    >
                      Start Your Journey
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center pb-2">
                      Join thousands who are already in control of their finances
                    </p>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center pb-4">
                    <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
                      Swipe to continue
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  );
};

export default OnboardingSlides;
