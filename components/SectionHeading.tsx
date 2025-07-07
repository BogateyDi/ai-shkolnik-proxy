
import React from 'react';
import { Icon } from '@/components/Icon';

interface SectionHeadingProps {
  title: string;
  iconName: string;
  iconClass?: string;
  children?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, iconName, iconClass = 'text-blue-500', children }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-200">
        <div className="flex items-center">
          <Icon name={iconName} className={`text-2xl mr-3 ${iconClass}`} />
          <h2 id={title.replace(/\s+/g, '-').toLowerCase()} className="text-2xl font-bold text-gray-800">
            {title}
          </h2>
        </div>
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
};