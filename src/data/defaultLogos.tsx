import React from 'react';

// SVG Logo TS25 (Program Transformasi Sekolah 2025 - Rasmi KPM)
export const DEFAULT_TS25_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="tsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b3b60"/>
      <stop offset="100%" stop-color="#021d34"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#9f1239"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <!-- Outer Ring -->
  <circle cx="100" cy="100" r="94" fill="#ffffff" stroke="#0b3b60" stroke-width="7"/>
  <circle cx="100" cy="100" r="85" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-dasharray="4,2"/>
  
  <!-- Text Along Arc / Curved Ribbon -->
  <path id="textArcTop" d="M 28 100 A 72 72 0 0 1 172 100" fill="none"/>
  <text font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="10.5" font-weight="900" fill="#0b3b60" letter-spacing="1">
    <textPath href="#textArcTop" startOffset="50%" text-anchor="middle">
      PROGRAM TRANSFORMASI SEKOLAH
    </textPath>
  </text>
  
  <path id="textArcBottom" d="M 172 104 A 72 72 0 0 1 28 104" fill="none"/>
  <text font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="11.5" font-weight="900" fill="#e11d48" letter-spacing="2">
    <textPath href="#textArcBottom" startOffset="50%" text-anchor="middle">
      KEMENTERIAN PENDIDIKAN
    </textPath>
  </text>

  <!-- Central Badge & 'TS25' -->
  <circle cx="100" cy="102" r="54" fill="#f8fafc" stroke="#0b3b60" stroke-width="2"/>
  <rect x="52" y="78" width="96" height="46" rx="8" fill="url(#tsGrad)"/>
  <text x="100" y="112" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">
    TS<tspan fill="#f59e0b">25</tspan>
  </text>

  <!-- Stars & Laurel -->
  <polygon points="100,60 102.5,67 110,67 104,71.5 106.5,78.5 100,74 93.5,78.5 96,71.5 90,67 97.5,67" fill="url(#goldGrad)"/>
  <polygon points="68,136 70,141 75,141 71,144 72.5,149 68,146 63.5,149 65,144 61,141 66,141" fill="url(#goldGrad)"/>
  <polygon points="132,136 134,141 139,141 135,144 136.5,149 132,146 127.5,149 129,144 125,141 130,141" fill="url(#goldGrad)"/>
</svg>
`)}`;

// SVG Logo Sekolah Default (Lencana Sekolah Malaysia Rasmi)
export const DEFAULT_SCHOOL_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <defs>
    <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b6b5c"/>
      <stop offset="100%" stop-color="#044238"/>
    </linearGradient>
    <linearGradient id="goldCrest" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  
  <!-- Crest Shield Body -->
  <path d="M 30 20 L 170 20 Q 170 120 100 190 Q 30 120 30 20 Z" fill="#ffffff" stroke="url(#crestGrad)" stroke-width="7"/>
  <path d="M 40 30 L 160 30 Q 160 115 100 176 Q 40 115 40 30 Z" fill="url(#crestGrad)" opacity="0.08"/>
  <path d="M 46 36 L 154 36 Q 154 112 100 168 Q 46 112 46 36 Z" fill="none" stroke="url(#goldCrest)" stroke-width="2"/>

  <!-- Divided Quadrants Inside Shield -->
  <line x1="100" y1="36" x2="100" y2="168" stroke="url(#goldCrest)" stroke-width="2"/>
  <line x1="46" y1="95" x2="154" y2="95" stroke="url(#goldCrest)" stroke-width="2"/>

  <!-- Quadrant 1: Torch of Knowledge -->
  <g transform="translate(68, 62) scale(0.7)">
    <path d="M 5 30 L 15 30 L 12 45 L 8 45 Z" fill="#b45309"/>
    <path d="M 10 5 C 18 15 14 25 10 30 C 6 25 2 15 10 5 Z" fill="#dc2626"/>
    <circle cx="10" cy="18" r="4" fill="#fbbf24"/>
  </g>

  <!-- Quadrant 2: Open Book -->
  <g transform="translate(122, 60) scale(0.7)">
    <path d="M 0 10 Q 12 5 24 10 L 24 30 Q 12 25 0 30 Z" fill="#0b6b5c"/>
    <path d="M 0 10 Q -12 5 -24 10 L -24 30 Q -12 25 0 30 Z" fill="#0b6b5c"/>
    <line x1="0" y1="10" x2="0" y2="30" stroke="#fbbf24" stroke-width="2"/>
  </g>

  <!-- Quadrant 3: Atom / STEM Science -->
  <g transform="translate(73, 126) scale(0.65)">
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="#0b6b5c" stroke-width="2" transform="rotate(30)"/>
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="#0b6b5c" stroke-width="2" transform="rotate(-30)"/>
    <circle cx="0" cy="0" r="3" fill="#b45309"/>
  </g>

  <!-- Quadrant 4: Gear of Innovation -->
  <g transform="translate(127, 126) scale(0.65)">
    <circle cx="0" cy="0" r="11" fill="none" stroke="#0b6b5c" stroke-width="3"/>
    <circle cx="0" cy="0" r="4" fill="#b45309"/>
    <line x1="-15" y1="0" x2="15" y2="0" stroke="#0b6b5c" stroke-width="2"/>
    <line x1="0" y1="-15" x2="0" y2="15" stroke="#0b6b5c" stroke-width="2"/>
  </g>

  <!-- Lower Motto Ribbon -->
  <path d="M 20 185 L 180 185 L 170 208 L 100 202 L 30 208 Z" fill="url(#goldCrest)"/>
  <path d="M 30 185 L 170 185 L 162 203 L 100 198 L 38 203 Z" fill="#044238"/>
  <text x="100" y="196" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">
    BERILMU · BERBAKTI · BERKUALITI
  </text>
</svg>
`)}`;

interface LogoDisplayProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackType: 'school' | 'ts25';
}

export const SchoolLogoDisplay: React.FC<LogoDisplayProps> = ({
  src,
  alt,
  className = 'w-10 h-10',
  fallbackType
}) => {
  const defaultSrc = fallbackType === 'school' ? DEFAULT_SCHOOL_SVG : DEFAULT_TS25_SVG;
  const imageSrc = src && src.trim() ? src : defaultSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`object-contain ${className}`}
      onError={e => {
        // Fallback jika URL luar gagal dimuatkan
        const target = e.currentTarget;
        if (target.src !== defaultSrc) {
          target.src = defaultSrc;
        }
      }}
    />
  );
};
