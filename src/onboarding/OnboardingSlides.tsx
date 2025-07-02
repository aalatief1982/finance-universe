import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    image: '/assets/onboarding/slide1.png',
    title: 'Welcome to Xpensia',
    subtitle: 'Track expenses the easy way'
  },
  {
    image: '/assets/onboarding/slide2.png',
    title: 'Stay Organized',
    subtitle: 'Everything in one place'
  },
  {
    image: '/assets/onboarding/slide3.png',
    title: 'Get Insights',
    subtitle: 'Understand your spending'
  }
];

interface Props {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<Props> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);

  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const arrow = isRtl ? '←' : '→';

  return (
    <div dir="auto" className="flex flex-col h-screen overflow-y-auto justify-between pb-6">
      <Swiper
        className="flex-1"
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        loop={false}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i} className="flex items-center">
            <motion.div
              className="flex flex-col items-center justify-center text-center px-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <img src={slide.image} alt={slide.title} className="max-h-72 mx-auto mb-6" />
              <h2
                className="mb-2 font-bold"
                style={{ color: '#2C3E50', fontFamily: 'Roboto', fontSize: '24px' }}
              >
                {slide.title}
              </h2>
              <p
                className="text-base"
                style={{ color: '#2C3E50', fontFamily: 'Roboto' }}
              >
                {slide.subtitle}
              </p>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex justify-center gap-2 my-4">
        {slides.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 w-2 rounded-full',
              i === index ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      <div className="px-4">
        {index === slides.length - 1 && (
          <Button className="w-full" onClick={onComplete}>
            {`Start the Journey ${arrow}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingSlides;
