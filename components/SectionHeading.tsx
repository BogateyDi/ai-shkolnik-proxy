
import React from 'react';
import { Icon } from '@/components/Icon';

interface SectionHeadingProps {
  title: string;
  iconName?: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, iconName, className = '' }) => {
  return (
    <div className={`flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 ${className}`}>
      {iconName && (
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl shadow-sm">
          <Icon name={iconName} className="text-2xl" />
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
    </div>
  );
};
