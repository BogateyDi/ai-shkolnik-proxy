
import React from 'react';
import type { OptionData } from '@/types';

interface OptionButtonProps {
  option: OptionData;
  isSelected: boolean;
  onClick: (id: string) => void;
  disabled?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ option, isSelected, onClick, disabled = false }) => {
  const baseClasses = "text-left w-full px-5 py-4 rounded-lg transition-all duration-200 border-2 group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 shadow-sm";
  const activeClasses = "border-blue-500 bg-blue-50 text-blue-700 font-semibold";
  const inactiveClasses = "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50";
  const disabledClasses = "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300";

  return (
    <button
      type="button"
      onClick={() => onClick(option.id)}
      className={`${baseClasses} ${disabled ? disabledClasses : (isSelected ? activeClasses : inactiveClasses)}`}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      <div className="font-medium">{option.name}</div>
      {option.subtext && <div className="text-xs font-normal mt-1">{option.subtext}</div>}
    </button>
  );
};