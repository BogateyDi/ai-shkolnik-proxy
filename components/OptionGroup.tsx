

import React from 'react';
import { OptionButton } from '@/components/OptionButton';
import { Icon } from '@/components/Icon';
import { OptionData } from '@/types';

interface OptionGroupProps {
  options: OptionData[];
  selectedValue: string | null;
  onSelect: (id: string) => void;
  gridCols?: string;
  disabled?: boolean;
  title?: string;
  sectionIcon?: string;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({
  options,
  selectedValue,
  onSelect,
  gridCols = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  disabled = false,
  title,
  sectionIcon,
}) => {
  const containerClasses = `mb-12 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${title ? 'p-6 sm:p-8 bg-slate-700/30 rounded-xl shadow-xl border border-slate-600/50 backdrop-blur-sm' : ''}`;
  
  return (
    <div className={containerClasses}>
      {title && (
        <div className="flex items-center mb-6">
          {sectionIcon && <Icon name={sectionIcon} className="text-2xl text-amber-400 mr-3" />}
          <h3 className="font-semibold text-2xl text-amber-400">
            {title}
          </h3>
        </div>
      )}
      <div className={`grid ${gridCols} gap-4`}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            isSelected={selectedValue === option.id}
            onClick={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};