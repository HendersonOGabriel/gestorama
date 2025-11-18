import React, { ReactNode } from 'react';

interface AnimatedItemProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, duration = 500, className = '' }) => {
  const style: React.CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  };

  return (
    <div style={style} className={`animate-fade-in-up ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedItem;
