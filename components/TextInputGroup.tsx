
import React from 'react';
import { Icon } from '@/components/Icon';

interface TextInputGroupProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  rows?: number;
  isRequired?: boolean;
  note?: string;
  disabled?: boolean;
  sectionIcon?: string;
  containerClassName?: string;
  min?: number;
  max?: number;
}

export const TextInputGroup: React.FC<TextInputGroupProps> = ({
  title,
  value,
  onChange,
  inputId,
  placeholder,
  type = 'text',
  rows,
  isRequired = false,
  note,
  disabled = false,
  sectionIcon,
  containerClassName = '',
  min,
  max,
}) => {
  const commonInputClasses = "block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:opacity-70";

  return (
    <div className={`${containerClassName}`}>
      <label htmlFor={inputId} className="block text-md font-medium text-gray-700 mb-2">
        {sectionIcon && <Icon name={sectionIcon} className="mr-2 text-blue-500" />}
        {title}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {rows ? (
        <textarea
          id={inputId}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={commonInputClasses}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          className={commonInputClasses}
        />
      )}
      {note && <p className="mt-2 text-sm text-gray-500">{note}</p>}
    </div>
  );
};