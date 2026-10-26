import React from 'react';
import logoImg from '../assets/logo.png';

interface GigaIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const GigaIcon: React.FC<GigaIconProps> = ({
  className = '',
  size = 28,
  glow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${glow ? 'giga-glow' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={logoImg}
        alt="GigaCrypt"
        width={size}
        height={size}
        className="object-contain rounded-xl drop-shadow-md pointer-events-none"
      />
    </div>
  );
};
