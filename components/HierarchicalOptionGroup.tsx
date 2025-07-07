

import React, { useState } from 'react';
import { BookAICategory, BookAISubItem } from '@/types';
import { Icon } from '@/components/Icon';
import { OptionButton } from '@/components/OptionButton';

interface HierarchicalOptionGroupProps {
  title: string;
  categories: BookAICategory[];
  selectedValues: string[];
  onSelect: (id: string) => void;
  maxSelections: number;
  sectionIcon?: string;
  note?: string;
  noteIcon?: string;
  disabled?: boolean;
}

export const HierarchicalOptionGroup: React.FC<HierarchicalOptionGroupProps> = ({
  title,
  categories,
  selectedValues,
  onSelect,
  maxSelections,
  sectionIcon,
  note,
  noteIcon,
  disabled = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div className={`mb-12 p-6 sm:p-8 bg-slate-700/30 rounded-xl shadow-xl option-container-custom border border-slate-600/50 backdrop-blur-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center mb-6">
        {sectionIcon && <Icon name={sectionIcon} className="text-2xl text-amber-400 mr-3 inline-flex items-center" />}
        <h3 className="font-semibold text-2xl text-amber-400 relative after:content-[''] after:absolute after:left-0 after:bottom-[-10px] after:w-20 after:h-[3px] after:bg-gradient-to-r after:from-amber-500 after:to-yellow-400 after:rounded-full">
          {title} (выберите до {maxSelections})
        </h3>
      </div>
      
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category.id} className="border border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-700 hover:bg-slate-600/80 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset"
              aria-expanded={!!expandedCategories[category.id]}
              aria-controls={`category-panel-${category.id}`}
            >
              <span className="font-medium text-slate-100">{category.name}</span>
              <Icon 
                name={`fas fa-chevron-${expandedCategories[category.id] ? 'up' : 'down'}`} 
                className="text-slate-400 transition-transform duration-200"
              />
            </button>
            {expandedCategories[category.id] && (
              <div id={`category-panel-${category.id}`} className="p-4 bg-slate-700/50 border-t border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.subItems.map(subItem => (
                    <OptionButton
                      key={subItem.id}
                      option={subItem}
                      isSelected={selectedValues.includes(subItem.id)}
                      onClick={() => onSelect(subItem.id)}
                      disabled={!selectedValues.includes(subItem.id) && selectedValues.length >= maxSelections}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {note && (
        <p className="text-sm text-slate-400 mt-5 ml-1 flex items-center">
          {noteIcon && <Icon name={noteIcon} className="mr-2 text-amber-500 inline-flex items-center" />}
          {note}
        </p>
      )}
    </div>
  );
};