
import React from 'react';

interface IconProps {
  name: string; // e.g., "fas fa-magic-sparkles"
  className?: string;
  ariaHidden?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', ariaHidden = true }) => {
  return <i className={`${name} ${className}`} aria-hidden={ariaHidden}></i>;
};
