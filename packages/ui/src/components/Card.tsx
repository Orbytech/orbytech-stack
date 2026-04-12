import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default',
    size = 'md',
    rounded = 'md',
    shadow = 'sm',
    hover = false,
    clickable = false,
    padding = 'md',
    children,
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-gray-200',
      outlined: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white border border-gray-100',
      filled: 'bg-gray-50 border-0',
      glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
    };

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    };

    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      full: 'rounded-full',
    };

    const shadowClasses = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const hoverClasses = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1' : '';
    const clickableClasses = clickable ? 'cursor-pointer active:scale-95' : '';

    const MotionCard = motion.div;

    return (
      <MotionCard
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          roundedClasses[rounded],
          shadowClasses[shadow],
          paddingClasses[padding],
          hoverClasses,
          clickableClasses,
          className
        )}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        whileHover={clickable ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </MotionCard>
    );
  }
);

Card.displayName = 'Card';

export { Card };
