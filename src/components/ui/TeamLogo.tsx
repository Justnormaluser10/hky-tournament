'use client';

import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  logo?: string | null;
  name?: string;
  shortName?: string;
  primaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

// Module-level cache to ensure images are processed only once per session
const logoCache = new Map<string, string>();

/**
 * Checks if an image has a solid black or white background and non-destructively
 * removes the background via perimeter-connected flood fill on a canvas, leaving
 * the actual logo artwork, inner details, and proportions 100% intact.
 */
function processLogoBackground(url: string): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve(url);
  if (!url || typeof url !== 'string' || url.trim() === '') return Promise.resolve(url);

  if (logoCache.has(url)) {
    return Promise.resolve(logoCache.get(url)!);
  }

  // SVG images or data SVGs generally manage their own transparency
  if (url.includes('image/svg+xml') || url.endsWith('.svg')) {
    logoCache.set(url, url);
    return Promise.resolve(url);
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) {
          logoCache.set(url, url);
          return resolve(url);
        }

        // Keep crisp quality while optimizing processing time
        const maxDim = 512;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          logoCache.set(url, url);
          return resolve(url);
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample 4 corners
        const cornerAlpha = [
          data[3],
          data[(w - 1) * 4 + 3],
          data[((h - 1) * w) * 4 + 3],
          data[((h - 1) * w + w - 1) * 4 + 3],
        ];

        // If corners are already transparent, preserve the original image as-is
        if (cornerAlpha.every((a) => a < 25)) {
          logoCache.set(url, url);
          return resolve(url);
        }

        // Check if corners are solid black or solid white
        const cornerColors = [
          [data[0], data[1], data[2]],
          [data[(w - 1) * 4], data[(w - 1) * 4 + 1], data[(w - 1) * 4 + 2]],
          [data[((h - 1) * w) * 4], data[((h - 1) * w) * 4 + 1], data[((h - 1) * w) * 4 + 2]],
          [data[((h - 1) * w + w - 1) * 4], data[((h - 1) * w + w - 1) * 4 + 1], data[((h - 1) * w + w - 1) * 4 + 2]],
        ];

        const isBlack = cornerColors.every(([r, g, b]) => r <= 32 && g <= 32 && b <= 32);
        const isWhite = cornerColors.every(([r, g, b]) => r >= 225 && g >= 225 && b >= 225);

        // If neither solid black nor solid white, do not touch the image
        if (!isBlack && !isWhite) {
          logoCache.set(url, url);
          return resolve(url);
        }

        // Perimeter flood fill: only clear pixels that are directly connected to the boundary
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const threshold = isBlack ? 36 : 38;
        const featherRange = 18;

        const colorDist = (r: number, g: number, b: number) => {
          if (isBlack) {
            return Math.max(r, g, b);
          } else {
            return Math.max(255 - r, 255 - g, 255 - b);
          }
        };

        // Seed with outer perimeter borders
        for (let x = 0; x < w; x++) {
          queue[tail++] = x;
          queue[tail++] = (h - 1) * w + x;
        }
        for (let y = 1; y < h - 1; y++) {
          queue[tail++] = y * w;
          queue[tail++] = y * w + (w - 1);
        }

        while (head < tail) {
          const idx = queue[head++];
          if (visited[idx]) continue;
          visited[idx] = 1;

          const px = idx * 4;
          const r = data[px];
          const g = data[px + 1];
          const b = data[px + 2];

          const dist = colorDist(r, g, b);
          if (dist <= threshold) {
            // Contiguous background pixel: set fully transparent
            data[px + 3] = 0;

            const x = idx % w;
            const y = (idx / w) | 0;

            if (x > 0 && !visited[idx - 1]) queue[tail++] = idx - 1;
            if (x < w - 1 && !visited[idx + 1]) queue[tail++] = idx + 1;
            if (y > 0 && !visited[idx - w]) queue[tail++] = idx - w;
            if (y < h - 1 && !visited[idx + w]) queue[tail++] = idx + w;
          } else if (dist <= threshold + featherRange) {
            // Smooth anti-aliased edge feathering
            const alpha = Math.floor(((dist - threshold) / featherRange) * 255);
            if (alpha < data[px + 3]) {
              data[px + 3] = alpha;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const processedUrl = canvas.toDataURL('image/png');
        logoCache.set(url, processedUrl);
        resolve(processedUrl);
      } catch (err) {
        // Fallback safely to original URL if any canvas operation fails
        logoCache.set(url, url);
        resolve(url);
      }
    };

    img.onerror = () => {
      resolve(url);
    };

    img.src = url;
  });
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
  const [displaySrc, setDisplaySrc] = useState<string>(() => {
    if (logo && logoCache.has(logo)) {
      return logoCache.get(logo)!;
    }
    return logo || '';
  });

  useEffect(() => {
    if (!logo || typeof logo !== 'string' || logo.trim() === '') {
      setDisplaySrc('');
      return;
    }

    if (logoCache.has(logo)) {
      setDisplaySrc(logoCache.get(logo)!);
      return;
    }

    let isMounted = true;
    processLogoBackground(logo).then((cleaned) => {
      if (isMounted) {
        setDisplaySrc(cleaned);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [logo]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-32 h-32 text-2xl',
  };

  const abbreviation =
    shortName ||
    (name && typeof name === 'string'
      ? name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w[0])
          .slice(0, 3)
          .join('')
          .toUpperCase() || 'HKY'
      : 'HKY');

  const isUrl = Boolean(
    !imageError &&
    displaySrc &&
    typeof displaySrc === 'string' &&
    displaySrc.trim() !== '' &&
    (displaySrc.startsWith('http') || displaySrc.startsWith('/') || displaySrc.startsWith('data:'))
  );

  if (isUrl) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-950/80 to-blue-950/70 border border-white/10 shadow-lg backdrop-blur-sm p-1 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={displaySrc}
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
