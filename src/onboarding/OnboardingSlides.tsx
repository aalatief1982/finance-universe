import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ArrowRight, Zap, Brain, PieChart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

import 'swiper/css';
import 'swiper/css/effect-fade';

const DEBUG_STARTUP = new URLSearchParams(window.location.search).get('debugStartup') === '1';

interface Slide {
  image: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  gradient: string;
}

const slides: Slide[] = [
  {
    image: '/assets/onboarding1-1.png',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    descriptionKey: 'onboarding.slide1.description',
    icon: <Zap className="w-8 h-8" />,
    gradient: 'from-primary/20 via-primary/10 to-transparent'
  },
  {
    image: '/assets/onboarding2-2.png',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    descriptionKey: 'onboarding.slide2.description',
    icon: <Brain className="w-8 h-8" />,
    gradient: 'from-secondary/20 via-secondary/10 to-transparent'
  },
  {
    image: '/assets/onboarding3-3.png',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    descriptionKey: 'onboarding.slide3.description',
    icon: <PieChart className="w-8 h-8" />,
    gradient: 'from-accent/20 via-accent/10 to-transparent'
  }
];

interface Props {
  onComplete: () => void;
  isSubmitting?: boolean;
  flickerDiag?: number;
}

const OnboardingSlides: React.FC<Props> = ({ onComplete, isSubmitting = false, flickerDiag = 0 }) => {
  const { t, language, setLanguage } = useLanguage();
  const noAnim = flickerDiag === 2;
  const fixedDims = flickerDiag === 3;
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasLoggedFirstSlideRender = useRef(false);
  const shouldLogImageLoadErrors = import.meta.env.MODE === 'development';
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
    if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #10] OnboardingSlides Mounted\nTime: ${performance.now().toFixed(2)}ms\ninnerHeight: ${window.innerHeight}`);
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
      
      {/* Language selector - top center, only on first slide */}
      {index === 0 && (
        <div className="absolute left-4 rtl:left-auto rtl:right-4 z-30" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
            className="bg-card/90 backdrop-blur-sm border border-border/60 rounded-xl px-5 py-3 text-lg font-semibold text-foreground shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer"
            style={{ paddingRight: '3rem', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.875rem center' }}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>
      )}

      {/* Pagination dots */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
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
        className="h-full"
        style={{ height: '100%' }}
        speed={600}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="flex flex-col flex-1 min-h-0 h-full transition-all duration-700">
              {/* Header with icon and gradient */}
              <div
                className={`relative pb-4 bg-gradient-to-b ${slide.gradient} shrink-0 pt-8`}
              >
                <div className="flex flex-col items-center text-center px-4" style={index === 0 ? { paddingTop: '2rem' } : undefined}>
                  <div className="mb-3 p-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                    <div className="text-primary">
                      {slide.icon}
                    </div>
                  </div>
                  <h1 className={`text-2xl sm:text-3xl font-bold text-foreground mb-2 ${noAnim ? '' : 'animate-slide-up'}`}>
                    {t(slide.titleKey)}
                  </h1>
                  <p className={`text-base sm:text-lg font-medium text-primary mb-2 ${noAnim ? '' : 'animate-slide-up'}`} style={noAnim ? undefined : { animationDelay: '0.1s' }}>
                    {t(slide.subtitleKey)}
                  </p>
                  <p className={`text-sm text-muted-foreground max-w-sm leading-relaxed ${noAnim ? '' : 'animate-slide-up'}`} style={noAnim ? undefined : { animationDelay: '0.2s' }}>
                    {t(slide.descriptionKey)}
                  </p>
                </div>
              </div>
              {/* Image section */}
              <div className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
                <div
                  className="relative w-full max-w-xs flex items-center justify-center"
                  style={fixedDims ? { width: 280, height: 400 } : { maxHeight: '42vh' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl transform rotate-1" />
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 shadow-xl w-full h-fit flex items-center justify-center">
                    <img
                      src={slide.image.trim()}
                      alt={t(slide.titleKey)}
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
                      {isSubmitting ? t('onboarding.starting') : t('onboarding.startJourney')}
                      <ArrowRight className="ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180 w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-200" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center pb-2">
                      {t('onboarding.joinThousands')}
                    </p>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
                      {t('onboarding.swipeToContinue')}
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
