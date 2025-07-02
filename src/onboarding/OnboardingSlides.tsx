import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
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
    subtitle: 'Smart parsing of SMS and receipts in seconds'
  },
  {
    image: '/assets/onboarding2.png',
    title: 'Auto-Categorized for You',
    subtitle: 'No setup needed — we learn as you go'
  },
  {
    image: '/assets/onboarding3.png',
    title: 'See Where Your Money Goes',
    subtitle: 'Real-time dashboards and easy reports'
  }
];

interface Props {
  onComplete: () => void;
}

const OnboardingSlides: React.FC<Props> = ({ onComplete }) => {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const handleSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on('select', handleSelect);
    handleSelect();
    return () => {
      embla.off('select', handleSelect);
    };
  }, [embla]);

  const handleNext = () => {
    if (!embla) return;
    if (index >= slides.length - 1) {
      onComplete();
    } else {
      embla.scrollNext();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col h-screen justify-between pb-6">
      <div className="flex-1" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <motion.div
              key={i}
              className="flex-[0_0_100%] flex flex-col items-center justify-center text-center px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <img src={slide.image} alt="" className="max-h-72 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">{slide.title}</h2>
              <p className="text-muted-foreground">{slide.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </div>

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
        {index < slides.length - 1 ? (
          <div className="flex w-full gap-2">
            <Button variant="ghost" className="flex-1" onClick={handleSkip}>
              Skip
            </Button>
            <Button className="flex-1" onClick={handleNext}>
              Next →
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={onComplete}>
            Start the Journey →
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingSlides;
