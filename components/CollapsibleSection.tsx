

import React, { useState } from 'react';
import { Icon } from '@/components/Icon';

interface CollapsibleSectionProps {
  title: string;
  initialOpen?: boolean;
  children: React.ReactNode;
  titleClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  initialOpen = false,
  children,
  titleClassName = 'text-2xl',
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left bg-slate-700/50 hover:bg-slate-700/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset"
        aria-expanded={isOpen}
      >
        <h4 className={`font-semibold text-slate-100 ${titleClassName}`}>{title}</h4>
        <Icon
          name={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
          className="text-slate-300 text-xl transition-transform transform duration-300"
        />
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};