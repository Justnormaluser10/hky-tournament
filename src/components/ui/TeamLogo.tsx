'use client';

import React, { useState } from 'react';

interface TeamLogoProps {
  logo?: string | null;
  name?: string;
  shortName?: string;
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function TeamLogo({
  logo,
  name = '',
  shortName,
  primaryColor = '#059669',
  size = 'md',
  className = '',
}: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-32 h-32 text-2xl',
  };

  const abbreviation =
    shortName ||
    (name
      ? name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 3)
          .join('')
          .toUpperCase()
      : 'HKY');

  const isUrl = Boolean(
    !imageError &&
    logo &&
    typeof logo === 'string' &&
    logo.trim() !== '' &&
    (logo.startsWith('http') || logo.startsWith('/') || logo.startsWith('data:'))
  );

  if (isUrl) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl overflow-hidden bg-slate-900/80 p-1 border border-white/10 shadow-lg ${sizeClasses[size]} ${className}`}
      >
        <img
          src={logo!}
          alt={name || 'Team Logo'}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Club Shield / Crest
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl font-black select-none shadow-lg tracking-wider border border-white/20 transition-transform duration-300 hover:scale-105 ${sizeClasses[size]} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}dd 0%, #090d16 100%)`,
        boxShadow: `0 4px 20px ${primaryColor}40`,
      }}
      title={name}
    >
      {/* Decorative hockey stick angles */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none p-1"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M8 8 L32 38 C34 40 38 40 40 36 C42 32 40 28 36 28 L14 8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="relative z-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
        {abbreviation}
      </span>
    </div>
  );
}
