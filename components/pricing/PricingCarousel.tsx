
import React, { useState, Children, isValidElement, cloneElement } from 'react';
import { cn } from '../../utils/helpers';

interface PricingCarouselProps {
  children: React.ReactNode;
  initialSlide?: number;
}

export const PricingCarousel: React.FC<PricingCarouselProps> = ({ children, initialSlide = 1 }) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const slides = Children.toArray(children);
  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) { // Swiped left
      nextSlide();
    } else if (diff < -50) { // Swiped right
      prevSlide();
    }
    setTouchStartX(null);
  };

  // Each slide takes up 80% of the viewport width. The gap is 4 (1rem).
  // We want to center the active slide. The offset should be calculated
  // to shift the container left or right.
  // Total width of a slide + gap = 80% + 1rem.
  // The first slide needs to be offset by half the remaining space (10%) to be centered.
  const offset = `calc(10% - ${currentSlide} * (80% + 1rem))`;

  return (
    <div className="relative w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="overflow-hidden">
        {/* Slides container */}
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(${offset})` }}
        >
          {Children.map(children, (child, index) => {
            if (isValidElement(child)) {
              return (
                <div className="flex-shrink-0 w-full pl-4" style={{ flexBasis: '80%' }}>
                  {cloneElement(child, {
                    ...child.props,
                    className: cn(
                      child.props.className,
                      'transition-all duration-300',
                      currentSlide === index ? 'scale-100 opacity-100' : 'scale-90 opacity-60'
                    ),
                  })}
                </div>
              );
            }
            return child;
          })}
        </div>
      </div>

      {/* Dots for Mobile Carousel */}
      <div className="flex justify-center items-center gap-2 pt-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              currentSlide === index ? "w-6 bg-indigo-500" : "w-2 bg-slate-600"
            )}
            aria-label={`Ir para o plano ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
