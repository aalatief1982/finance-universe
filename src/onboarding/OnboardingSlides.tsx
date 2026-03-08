import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade } from 'swiper/modules';
import { ArrowRight, Zap, Brain, PieChart } from 'lucide-react';

import 'swiper/css';
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
  isSubmitting?: boolean;
  flickerDiag?: number; // [REMOVABLE-FLICKER-DIAG]
}

const OnboardingSlides: React.FC<Props> = ({ onComplete, isSubmitting = false, flickerDiag = 0 }) => {
  // [REMOVABLE-FLICKER-DIAG] helpers
  const noAnim = flickerDiag === 2;
  const fixedDims = flickerDiag === 3;
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasLoggedFirstSlideRender = useRef(false);
  const shouldLogImageLoadErrors = import.meta.env.MODE === 'development';
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const handleCompleteOnce = React.useCallback(() => {
    if (isSubmitting) return;
    onComplete();
  }, [isSubmitting, onComplete]);

  useEffect(() => {
    console.trace('[TRACE][OnboardingSlides] component mounted', {
      timestamp: new Date().toISOString(),
    });

    const logViewportMetrics = (phase: 'mount' | 'after-first-paint') => {
      console.log(`[TRACE][OnboardingSlides] viewport metrics (${phase})`, {
        innerHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
      });
    };

    logViewportMetrics('mount');
    const rafId = window.requestAnimationFrame(() => {
      logViewportMetrics('after-first-paint');
    });

    setIsVisible(true);
    // Set a local --vh-onb CSS variable to handle mobile browser chrome (address bar)
    const setVh = () => {
      const previousValue = document.documentElement.style.getPropertyValue('--vh-onb');
      const nextValue = `${window.innerHeight * 0.01}px`;

      console.log('[TRACE][OnboardingSlides] writing --vh-onb', {
        previousValue,
        nextValue,
        innerHeight: window.innerHeight,
      });

      document.documentElement.style.setProperty('--vh-onb', nextValue);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => {
      console.trace('[TRACE][OnboardingSlides] component unmounted', {
        timestamp: new Date().toISOString(),
      });
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setVh);
    };
  }, []);

  useEffect(() => {
    console.trace('[TRACE][OnboardingSlides] slide index changed', {
      index,
      timestamp: new Date().toISOString(),
    });
  }, [index]);

  useEffect(() => {
    if (!hasLoggedFirstSlideRender.current && index === 0) {
      console.trace('[TRACE][OnboardingSlides] first slide rendered', {
        index,
        timestamp: new Date().toISOString(),
      });
      hasLoggedFirstSlideRender.current = true;
    }
  }, [index]);

  return (
    <div
      className="relative w-full h-[100dvh] bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      {/* Pagination dots */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center space-x-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                i === index 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
      <Swiper
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        modules={[EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        className="h-full"
        style={{ height: '100%' }}
        speed={600}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className={`flex flex-col flex-1 min-h-0 h-full transition-all duration-700 ${noAnim ? '' : 'animate-fade-in'}`}>
              {/* Header with icon and gradient */}
              <div
                className={`relative pb-4 bg-gradient-to-b ${slide.gradient} shrink-0 pt-8`}
              >
                <div className="flex flex-col items-center text-center px-4">
                  <div className="mb-3 p-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                    <div className="text-primary">
                      {slide.icon}
                    </div>
                  </div>
                  <h1 className={`text-2xl sm:text-3xl font-bold text-foreground mb-2 ${noAnim ? '' : 'animate-slide-up'}`}>
                    {slide.title}
                  </h1>
                  <p className={`text-base sm:text-lg font-medium text-primary mb-2 ${noAnim ? '' : 'animate-slide-up'}`} style={noAnim ? undefined : { animationDelay: '0.1s' }}>
                    {slide.subtitle}
                  </p>
                  <p className={`text-sm text-muted-foreground max-w-sm leading-relaxed ${noAnim ? '' : 'animate-slide-up'}`} style={noAnim ? undefined : { animationDelay: '0.2s' }}>
                    {slide.description}
                  </p>
                </div>
              </div>
              {/* Image section */}
              {/* [REMOVABLE-FLICKER-DIAG] fixedDims adds explicit sizing */}
              <div className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
                <div
                  className="relative w-full max-w-xs flex items-center justify-center"
                  style={fixedDims ? { width: 280, height: 400 } : { maxHeight: '42vh' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl transform rotate-1" />
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 shadow-xl w-full h-fit flex items-center justify-center">
                    <img
                      src={slide.image.trim()}
                      alt={slide.title}
                      className={`w-full h-auto max-h-[35vh] object-contain rounded-lg ${noAnim ? '' : 'animate-scale-in'}`}
                      style={fixedDims ? { width: 280, height: 360, animationDelay: noAnim ? undefined : '0.3s' } : noAnim ? undefined : { animationDelay: '0.3s' }}
                      onLoad={
                        i === 0
                          ? (event) => {
                              const imageElement = event.currentTarget;
                              console.trace('[TRACE][OnboardingSlides] slide image loaded', {
                                slideIndex: i,
                                imageUrl: imageElement.currentSrc || slide.image,
                                naturalWidth: imageElement.naturalWidth,
                                naturalHeight: imageElement.naturalHeight,
                                timestamp: new Date().toISOString(),
                              });
                            }
                          : undefined
                      }
                      onError={
                        shouldLogImageLoadErrors
                          ? () => console.error(`Failed to load image at slide ${i}: ${slide.image}`)
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Action section */}
              <div className="px-4 pt-2 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}>
                {i === slides.length - 1 ? (
                  <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <Button 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group" 
                      onClick={handleCompleteOnce}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Starting...' : 'Start Your Journey'}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center pb-2">
                      Join thousands who are already in control of their finances
                    </p>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center">
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
