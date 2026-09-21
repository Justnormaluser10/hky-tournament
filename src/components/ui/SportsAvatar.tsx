'use client';

import React from 'react';

interface SportsAvatarProps {
  photo?: string | null;
  name: string;
  jerseyNumber?: number;
  position?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SportsAvatar({
  photo,
  name,
  jerseyNumber,
  position,
  className = '',
  size = 'md',
}: SportsAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-28 h-28 text-2xl',
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (photo) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-900 shadow-md ${sizeClasses[size]} ${className}`}
      >
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Fallback to stylized silhouette if image URL fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Athletic Sports Avatar with dynamic jersey number & gradient
  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold tracking-wider select-none shadow-md border-2 border-emerald-500/30 bg-gradient-to-br from-slate-800 via-emerald-950 to-slate-900 text-emerald-300 ${sizeClasses[size]} ${className}`}
      title={`${name} ${jerseyNumber ? `(#${jerseyNumber})` : ''}`}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:8px_8px]" />
      
      {/* Hockey Athlete Stylized Head/Torso Silhouette */}
      <svg
        className="absolute bottom-0 w-3/4 h-3/4 opacity-40 text-emerald-400"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        {jerseyNumber !== undefined ? (
          <span className="font-extrabold text-amber-400 drop-shadow-sm font-mono">
            {jerseyNumber}
          </span>
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
    </div>
  );
}
