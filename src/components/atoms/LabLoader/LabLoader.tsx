import React from 'react';

interface LabLoaderProps {
  message?: string;
}

/**
 * Lab-themed loading overlay with CSS animated scientist.
 * Shows during silent background refreshes — old data visible underneath.
 * Reusable across all dashboard grids.
 */
const LabLoader: React.FC<LabLoaderProps> = ({
  message = 'Our scientist is fetching your data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* Animated scientist character */}
        <div className="relative w-20 h-24">
          <svg viewBox="0 0 80 96" fill="none" className="w-full h-full">
            {/* Head */}
            <circle cx="40" cy="18" r="12" className="fill-[#00a6fb]/20 stroke-[#00a6fb]" strokeWidth="2">
              <animate attributeName="cy" values="18;16;18" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Safety glasses */}
            <ellipse cx="35" cy="17" rx="5" ry="3" className="stroke-[#00a6fb]" strokeWidth="1.5" fill="none">
              <animate attributeName="cy" values="17;15;17" dur="1s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="45" cy="17" rx="5" ry="3" className="stroke-[#00a6fb]" strokeWidth="1.5" fill="none">
              <animate attributeName="cy" values="17;15;17" dur="1s" repeatCount="indefinite" />
            </ellipse>
            {/* Lab coat body */}
            <path d="M28 30 L24 65 L56 65 L52 30 Z" className="fill-white/80 dark:fill-gray-700/80 stroke-[#00a6fb]" strokeWidth="1.5">
              <animate attributeName="d" values="M28 30 L24 65 L56 65 L52 30 Z;M28 28 L24 63 L56 63 L52 28 Z;M28 30 L24 65 L56 65 L52 30 Z" dur="1s" repeatCount="indefinite" />
            </path>
            {/* Coat buttons */}
            <circle cx="40" cy="38" r="1.5" className="fill-[#00a6fb]">
              <animate attributeName="cy" values="38;36;38" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="46" r="1.5" className="fill-[#00a6fb]">
              <animate attributeName="cy" values="46;44;46" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Left arm holding beaker */}
            <path d="M28 35 L14 50" className="stroke-[#00a6fb]" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="d" values="M28 35 L14 50;M28 33 L12 46;M28 35 L14 50" dur="1.2s" repeatCount="indefinite" />
            </path>
            {/* Beaker in hand */}
            <g>
              <animate attributeName="transform" values="translate(0,0);translate(-2,-4);translate(0,0)" dur="1.2s" repeatCount="indefinite" />
              <path d="M8 45 L8 55 L20 55 L20 45 Z" className="stroke-[#00a6fb] fill-[#00a6fb]/10" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="9" y="49" width="10" height="5" rx="1" className="fill-[#00a6fb]/30">
                <animate attributeName="y" values="49;48;49" dur="0.8s" repeatCount="indefinite" />
              </rect>
              <circle cx="12" cy="50" r="1" className="fill-[#00a6fb]/50">
                <animate attributeName="cy" values="50;46;43" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="16" cy="51" r="0.8" className="fill-[#00a6fb]/50">
                <animate attributeName="cy" values="51;47;44" dur="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.2;0" dur="1.3s" repeatCount="indefinite" />
              </circle>
            </g>
            {/* Right arm with clipboard */}
            <path d="M52 35 L64 48" className="stroke-[#00a6fb]" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="d" values="M52 35 L64 48;M52 33 L66 44;M52 35 L64 48" dur="1s" repeatCount="indefinite" />
            </path>
            <g>
              <animate attributeName="transform" values="translate(0,0);translate(2,-4);translate(0,0)" dur="1s" repeatCount="indefinite" />
              <rect x="59" y="44" width="12" height="16" rx="2" className="fill-white dark:fill-gray-600 stroke-[#00a6fb]" strokeWidth="1.2" />
              <line x1="62" y1="49" x2="68" y2="49" className="stroke-[#00a6fb]/50" strokeWidth="1" />
              <line x1="62" y1="52" x2="68" y2="52" className="stroke-[#00a6fb]/50" strokeWidth="1" />
              <line x1="62" y1="55" x2="66" y2="55" className="stroke-[#00a6fb]/50" strokeWidth="1" />
            </g>
            {/* Legs with walking motion */}
            <line x1="34" y1="65" x2="30" y2="85" className="stroke-[#00a6fb]" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="x2" values="30;35;30" dur="0.8s" repeatCount="indefinite" />
            </line>
            <line x1="46" y1="65" x2="50" y2="85" className="stroke-[#00a6fb]" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="x2" values="50;45;50" dur="0.8s" repeatCount="indefinite" />
            </line>
            {/* Shoes */}
            <ellipse cx="30" cy="87" rx="5" ry="2.5" className="fill-[#00a6fb]/30">
              <animate attributeName="cx" values="30;35;30" dur="0.8s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="50" cy="87" rx="5" ry="2.5" className="fill-[#00a6fb]/30">
              <animate attributeName="cx" values="50;45;50" dur="0.8s" repeatCount="indefinite" />
            </ellipse>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#00a6fb] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default LabLoader;
