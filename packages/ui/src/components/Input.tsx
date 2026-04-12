import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    size = 'md',
    fullWidth = false,
    showPasswordToggle = false,
    loading = false,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputType = type === 'password' && showPassword ? 'text' : type;
    const hasError = !!error;
    const isDisabled = disabled || loading;

    const baseClasses = 'transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
      filled: 'bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
      outlined: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
      underlined: 'border-0 border-b-2 border-gray-300 bg-transparent rounded-none focus:border-blue-500 focus:ring-0 px-0',
    };

    const sizeClasses = {
      sm: 'text-sm px-3 py-2 h-8',
      md: 'text-sm px-4 py-2 h-10',
      lg: 'text-base px-4 py-3 h-12',
    };

    const containerClasses = cn(
      'relative',
      fullWidth && 'w-full'
    );

    const inputClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20',
      leftIcon && 'pl-10',
      (rightIcon || showPasswordToggle || loading) && 'pr-10',
      className
    );

    const labelClasses = cn(
      'block text-sm font-medium mb-2',
      hasError ? 'text-red-600' : 'text-gray-700',
      isDisabled && 'opacity-50'
    );

    const helperTextClasses = cn(
      'text-xs mt-1',
      hasError ? 'text-red-600' : 'text-gray-500'
    );

    const iconClasses = 'absolute inset-y-0 flex items-center pointer-events-none';

    const MotionInput = motion.input;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label className={labelClasses}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className={containerClasses}>
          {leftIcon && (
            <div className={cn(iconClasses, 'left-0 pl-3')}>
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          
          <MotionInput
            type={inputType}
            className={inputClasses}
            ref={ref}
            disabled={isDisabled}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            whileTap={{ scale: 0.995 }}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle || loading) && (
            <div className={cn(iconClasses, 'right-0 pr-3')}>
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              
              {showPasswordToggle && type === 'password' && !loading && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isDisabled}
                >
                  {showPassword ? (
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              )}
              
              {rightIcon && !loading && !showPasswordToggle && (
                <span className="text-gray-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={helperTextClasses}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
