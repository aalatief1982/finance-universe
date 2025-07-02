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
    image: '/assets/onboarding1.png',
    title: 'Track Expenses Instantly',
    subtitle: 'Smart parsing of SMS in seconds'
  },
  {
    image: '/assets/onboarding2.png',
    title: 'Auto-Categorized for You',
    subtitle: 'No setup needed, we learn as you go!'
  },
  {
    image: '/assets/onboarding3.png',
    title: 'See Where Your Money Goes',
    subtitle: 'Real-time dashboards & easy reports'
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
    <div dir="auto" className="flex flex-col h-[100dvh] overflow-hidden">
      <Swiper
        className="flex-1 min-h-0"
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        loop={false}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i} className="flex items-center justify-center h-full">
            <motion.div
              className="flex flex-col items-center justify-center text-center px-8 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <img
                src={slide.image}
                alt="Expense tracking illustration"
                className="max-h-72 md:max-h-96 mx-auto mb-6"
              />
              <h2
                className="mb-2 font-bold text-2xl md:text-3xl text-[#2C3E50]"
                style={{ fontFamily: 'Roboto' }}
              >
                {slide.title}
              </h2>
              <p
                className="text-base md:text-lg text-[#2C3E50]"
                style={{ fontFamily: 'Roboto' }}
              >
                {slide.subtitle}
              </p>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>


      <div
        className="px-4 pb-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
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
