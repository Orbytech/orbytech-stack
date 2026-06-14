import React from 'react';

export interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="currentColor" />
        <path d="M18 40C18 40 26 32 32 32C38 32 46 40 46 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M18 28C18 28 26 20 32 20C38 20 46 28 46 28" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 48V40" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 48V40" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
