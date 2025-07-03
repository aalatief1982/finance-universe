import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    image: '/assets/onboarding1-1.png',
    title: 'Track Expenses Instantly',
    subtitle: 'Smart parsing of SMS in seconds'
  },
  {
    image: '/assets/onboarding2-2.png',
    title: 'Auto-Categorized for You',
    subtitle: 'No setup needed, we learn as you go!'
  },
  {
    image: '/assets/onboarding3-3.png',
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
    <div dir="auto" className="w-full h-screen">
      <Swiper
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        pagination={{ clickable: true }}
        modules={[Pagination]}
        className="h-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="flex flex-col h-full items-center justify-between p-6 pt-10 text-center">
              {/* Image */}
              <img
                src={slide.image.trim()}
                alt={`Slide ${i}`}
                className="w-full max-h-[50vh] object-contain"
                onError={() => console.error(`Failed to load image: ${slide.image}`)}
              />

              {/* Text */}
              <div className="mt-6">
                <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">{slide.title}</h2>
                <p className="text-base text-[#2C3E50]">{slide.subtitle}</p>
              </div>

              {/* Final slide: button */}
              {i === slides.length - 1 ? (
                <div className="w-full pt-6">
                  <Button className="w-full" onClick={onComplete}>
                    {`Start the Journey ${arrow}`}
                  </Button>
                </div>
              ) : (
                <div className="h-12" /> // spacer for visual balance
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default OnboardingSlides;
