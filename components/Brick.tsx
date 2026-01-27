
import React from 'react';

interface BrickProps {
  color: 'red' | 'blue' | 'yellow' | 'green' | 'white' | 'black';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const colorConfig = {
  red: {
    bg: 'bg-[#C91A09]',
    border: 'border-[#8B1306]',
    shadow: 'shadow-[#8B1306]/40',
    highlight: 'after:bg-white/20'
  },
  blue: {
    bg: 'bg-[#0055BF]',
    border: 'border-[#003d8a]',
    shadow: 'shadow-[#003d8a]/40',
    highlight: 'after:bg-white/20'
  },
  yellow: {
    bg: 'bg-[#F2CD37]',
    border: 'border-[#B89400]',
    shadow: 'shadow-[#B89400]/40',
    highlight: 'after:bg-white/30'
  },
  green: {
    bg: 'bg-[#237841]',
    border: 'border-[#174d29]',
    shadow: 'shadow-[#174d29]/40',
    highlight: 'after:bg-white/20'
  },
  white: {
    bg: 'bg-[#F2F3F2]',
    border: 'border-[#A0A0A0]',
    shadow: 'shadow-[#A0A0A0]/30',
    highlight: 'after:bg-black/5'
  },
  black: {
    bg: 'bg-[#05131D]',
    border: 'border-[#000000]',
    shadow: 'shadow-black/50',
    highlight: 'after:bg-white/10'
  },
};

export const Brick: React.FC<BrickProps> = ({ color, children, className = '', onClick, size = 'md' }) => {
  const cfg = colorConfig[color];
  
  return (
    <div 
      onClick={onClick}
      className={`
        ${cfg.bg} ${cfg.border} ${cfg.shadow}
        relative rounded-xl border-b-[10px] border-r-[6px] p-6 shadow-xl 
        transform active:translate-y-1 active:translate-x-0.5 active:border-b-[4px] active:border-r-[2px]
        hover:-translate-y-1 hover:brightness-105 cursor-pointer
        group overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: `inset 4px 4px 0 rgba(255,255,255,0.2), inset -4px -4px 0 rgba(0,0,0,0.1), 10px 10px 20px rgba(0,0,0,0.15)`
      }}
    >
      {/* Glossy Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white via-transparent to-transparent`} />

      {/* Realistic Studs */}
      <div className="absolute -top-[14px] left-0 right-0 flex justify-around px-4 pointer-events-none">
        {[1, 2, 3, 4].slice(0, size === 'sm' ? 2 : 4).map(i => (
          <div key={i} className="relative">
            {/* Stud Body */}
            <div className={`w-6 h-4 rounded-t-lg ${cfg.bg} ${cfg.border} border-t border-x shadow-inner relative overflow-hidden`}>
                {/* Stud Highlight */}
                <div className="absolute top-1 left-1.5 w-1.5 h-1 bg-white/40 rounded-full blur-[0.5px]"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
